# Notification System Design

## What Exists Today and Why It's Not Enough

Before describing the proposed system, it's worth being honest about where the current implementation stands.

The project already has a notification scaffold. There's a `notifications` Firestore collection, an `addNotification` action in `tutorialsActions.js`, and a `NotificationBox` component that renders them. But the implementation has real gaps that would prevent it from working reliably at any meaningful scale:

- **One notification type.** The only event that triggers a notification is tutorial publication (`addNotification` is only called from `publishUnpublishTutorial`). There is no notification for comments, upvotes, follows, or any other interaction.

- **No recipient field.** `getNotificationData` fetches every document in the `notifications` collection with no `where` filter on user ID. Every user who opens the app would see every notification ever created.

- **No email delivery.** The project uses `cl_mail` + Firebase Extensions for transactional auth emails, but tutorial interaction events never write to `cl_mail`. Email notifications for tutorial activity do not exist.

- **No user preferences.** There is no way to opt out of a notification type or choose between in-app and email delivery.

- **No queue.** Notifications are written synchronously from the client inside a Redux action. If anything fails, it fails silently and the notification is lost.

The design below is built on top of the existing Firebase infrastructure. It does not require a new backend or a paid queue service — it works within the constraints of the project's current stack.

---

## ER Model

The diagram below shows every entity involved in the notification system and how they relate.

```
┌─────────────────────┐         ┌──────────────────────────┐
│       cl_user        │         │    notification_prefs     │
│─────────────────────│         │──────────────────────────│
│ uid (PK)            │1───────1│ uid (PK, FK → cl_user)   │
│ email               │         │ in_app_enabled: bool      │
│ displayName         │         │ email_enabled: bool       │
│ handle              │         │ muted_types: string[]     │
│ photoURL            │         │ email_digest: enum        │
│ createdAt           │         │   (instant|daily|weekly)  │
└─────────────────────┘         └──────────────────────────┘
          │1
          │
          │ receives
          │
          │N
┌─────────────────────────────────────────────────────────┐
│                      notifications                       │
│─────────────────────────────────────────────────────────│
│ notification_id (PK)                                     │
│ recipient_uid (FK → cl_user.uid)   ← who receives it    │
│ actor_uid (FK → cl_user.uid)       ← who caused it      │
│ actor_username: string                                   │
│ actor_photoURL: string                                   │
│ type: enum  (see Notification Types section)             │
│ priority: enum  (critical | high | normal | low)         │
│ channel: enum  (in_app | email | both)                   │
│ status: enum  (pending | delivered | read | failed)      │
│ tutorial_id: string (FK → tutorials, nullable)           │
│ tutorial_title: string (denormalized for display)        │
│ org: string  (org handle, for display)                   │
│ content: string  (rendered message body)                 │
│ metadata: map  (type-specific extra fields)              │
│ isRead: bool                                             │
│ createdAt: timestamp                                     │
│ deliveredAt: timestamp (nullable)                        │
│ expiresAt: timestamp (nullable)                          │
└─────────────────────────────────────────────────────────┘
          │N
          │
          │ grouped by
          │
          │1
┌─────────────────────┐
│   notification_      │
│   digest_queue       │
│─────────────────────│
│ queue_id (PK)        │
│ recipient_uid (FK)   │
│ notification_ids[]   │
│ scheduled_at         │
│ sent_at (nullable)   │
│ status               │
└─────────────────────┘
```

**Relationships in plain language:**

- One user has one preferences record (1:1). If no record exists, defaults apply.
- One user receives many notifications (1:N) — filtered by `recipient_uid`.
- One user causes many notifications as an actor (1:N) — linked by `actor_uid`.
- Many notifications can be grouped into a digest queue entry (N:1) for batched email delivery.
- One notification references at most one tutorial (N:1, nullable).

---

## Notification Types

Each type maps to a priority level and a default delivery channel. Users can override channel preferences in `notification_prefs`.

| Type constant | What triggers it | Priority | Default channel |
|---|---|---|---|
| `tutorial_published` | A tutorial you follow is published | `normal` | `in_app` |
| `tutorial_comment` | Someone comments on your tutorial | `high` | `both` |
| `tutorial_upvote` | Someone upvotes your tutorial | `low` | `in_app` |
| `tutorial_downvote` | Someone downvotes your tutorial | `low` | `in_app` |
| `comment_reply` | Someone replies to your comment | `high` | `both` |
| `comment_mention` | You are @mentioned in a comment | `high` | `both` |
| `tutorial_editor_added` | You were added as a tutorial editor | `high` | `both` |
| `org_member_added` | You were added to an organization | `critical` | `both` |
| `org_member_removed` | You were removed from an organization | `critical` | `both` |
| `org_role_changed` | Your role in an org was changed | `critical` | `both` |
| `new_follower` | Someone followed your profile | `normal` | `in_app` |
| `system_announcement` | Platform-level announcement | `critical` | `both` |

**Priority rules:**

- `critical` — always delivered to all channels, cannot be muted by the user
- `high` — delivered immediately, respects channel preference, cannot be batched into digest
- `normal` — delivered immediately in-app, email follows user's digest setting
- `low` — in-app only by default, batched if user has digest enabled

---

## System Flow Diagram

This is the complete path a notification takes from the moment a user performs an action to the moment the recipient sees it.

```
┌─────────────────────────────────────────────────────────────────────┐
│  USER ACTION                                                        │
│  (e.g. User B comments on User A's tutorial)                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CLIENT — Redux action dispatched                                   │
│  tutorialPageActions.js → addComment()                              │
│  Writes comment document to Firestore                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Firestore write triggers
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CLOUD FUNCTION — onWrite trigger                                   │
│  functions/onWriteFunctions.js                                      │
│  Listens on: tutorials/{tutorial_id}/comments/{comment_id}          │
│                                                                     │
│  Steps:                                                             │
│  1. Identify event type → tutorial_comment                          │
│  2. Resolve recipient_uid from tutorial.owner                       │
│  3. Guard: skip if actor === recipient (no self-notifications)      │
│  4. Read recipient's notification_prefs from Firestore              │
│  5. Check if type is muted → if yes, drop and exit                  │
│  6. Build notification document                                     │
│  7. Write to notification_queue collection (not directly to         │
│     notifications — this decouples creation from delivery)          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  NOTIFICATION QUEUE                                                 │
│  Firestore collection: notification_queue                           │
│  Status: pending                                                    │
│                                                                     │
│  Document fields:                                                   │
│  - all notification fields                                          │
│  - retry_count: 0                                                   │
│  - max_retries: 3                                                   │
│  - process_after: timestamp (now, or scheduled for digest)          │
└────────────────────────────┬────────────────────────────────────────┘
                             │ onCreate trigger fires
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DELIVERY FUNCTION — processes the queue                            │
│  functions/notificationDelivery.js                                  │
│                                                                     │
│  Runs on: notification_queue/{id} onCreate                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  Channel router                                          │      │
│  │                                                          │      │
│  │  channel === 'in_app' or 'both'                          │      │
│  │       ↓                                                  │      │
│  │  Write to notifications collection (recipient_uid index) │      │
│  │                                                          │      │
│  │  channel === 'email' or 'both'                           │      │
│  │       ↓                                                  │      │
│  │  priority === 'high' or 'critical'                       │      │
│  │       → write immediately to cl_mail                     │      │
│  │  priority === 'normal' or 'low'                          │      │
│  │       → write to notification_digest_queue               │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│  On success: mark queue doc status = 'processed'                   │
│  On failure: increment retry_count, reschedule if under max        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          ▼                                     ▼
┌─────────────────────┐             ┌───────────────────────────────┐
│  IN-APP DELIVERY    │             │  EMAIL DELIVERY               │
│                     │             │                               │
│  notifications      │             │  Immediate:                   │
│  collection updated │             │  cl_mail collection           │
│                     │             │  → Firebase Extension picks   │
│  Frontend real-time │             │    it up and sends via        │
│  listener fires     │             │    configured SMTP provider   │
│  (react-redux-      │             │                               │
│   firebase)         │             │  Digest:                      │
│                     │             │  notification_digest_queue    │
│  Redux state update │             │  → pubSub cron job batches    │
│  → bell icon badge  │             │    and sends one email        │
│  → notification     │             │    per user per interval      │
│    dropdown updates │             └───────────────────────────────┘
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│  USER SEES IT       │
│                     │
│  Bell icon shows    │
│  unread count       │
│                     │
│  Clicks to read →   │
│  isRead = true      │
│  status = read      │
└─────────────────────┘
```

---

## Database Schema

### `notifications` collection (Firestore)

This is what the current schema should be expanded to. Fields marked with `*` are new compared to the current implementation.

```
notifications/{notification_id}

  notification_id:    string    (document ID)
  recipient_uid:      string *  (FK → cl_user.uid — MISSING in current impl)
  actor_uid:          string *  (who triggered the event)
  actor_username:     string    (denormalized for display without extra query)
  actor_photoURL:     string *  (for avatar in notification card)
  type:               string *  (see notification types table above)
  priority:           string *  (critical | high | normal | low)
  channel:            string *  (in_app | email | both)
  status:             string *  (pending | delivered | read | failed)
  tutorial_id:        string    (nullable — present for tutorial-related types)
  tutorial_title:     string    (denormalized)
  org:                string    (org handle — denormalized)
  content:            string    (human-readable message, pre-rendered server-side)
  metadata:           map    *  (type-specific data, e.g. comment_id, step_number)
  isRead:             boolean
  createdAt:          timestamp
  deliveredAt:        timestamp * (nullable)
  expiresAt:          timestamp * (nullable — for auto-cleanup)
```

### `notification_prefs` collection (Firestore)

```
notification_prefs/{uid}

  uid:                string    (same as cl_user uid, document ID)
  in_app_enabled:     boolean   (default: true)
  email_enabled:      boolean   (default: true)
  email_digest:       string    (instant | daily | weekly, default: daily)
  muted_types:        string[]  (list of type constants the user has muted)
  updated_at:         timestamp
```

### `notification_queue` collection (Firestore)

```
notification_queue/{queue_id}

  queue_id:           string    (document ID)
  notification_data:  map       (copy of the notification document)
  status:             string    (pending | processing | processed | failed)
  retry_count:        number    (default: 0)
  max_retries:        number    (default: 3)
  process_after:      timestamp (when to deliver — now for immediate, future for digest)
  created_at:         timestamp
  processed_at:       timestamp (nullable)
  error:              string    (nullable — last error message on failure)
```

### `notification_digest_queue` collection (Firestore)

```
notification_digest_queue/{uid}

  uid:                string    (recipient user ID — one doc per user)
  pending_ids:        string[]  (notification_ids waiting to be batched)
  next_send_at:       timestamp (when the next digest email should go out)
  last_sent_at:       timestamp (nullable)
```

**Firestore indexes required:**
```
notifications: recipient_uid ASC, createdAt DESC
notifications: recipient_uid ASC, isRead ASC, createdAt DESC
notification_queue: status ASC, process_after ASC
```

---

## Delivery Mechanism

### In-App Delivery

The current `NotificationBox` component and Redux reducer can stay largely as-is, with one critical change: the `getNotificationData` query must filter by `recipient_uid`.

```js
// Current (fetches ALL notifications — wrong)
firestore.collection("notifications").orderBy("createdAt", "desc").get()

// Correct
firestore
  .collection("notifications")
  .where("recipient_uid", "==", currentUser.uid)
  .orderBy("createdAt", "desc")
  .limit(50)
  .get()
```

For real-time delivery (bell icon updates without a page refresh), the query should use `onSnapshot` instead of `get` so new notifications appear instantly.

### Email Delivery

The project already has a working email pipeline: writing a document to `cl_mail` triggers the Firebase Trigger Email Extension, which sends via the configured SMTP provider. This is already used for verification and password emails.

Notification emails follow the same pattern. The delivery Cloud Function writes to `cl_mail`:

```js
await db.collection("cl_mail").add({
  to: recipientEmail,
  template: {
    name: "notificationEmailTemplate",
    data: {
      actorName: notification.actor_username,
      content: notification.content,
      tutorialLink: `https://dev.codelabz.io/tutorial/${notification.tutorial_id}`,
      unsubscribeLink: `https://dev.codelabz.io/settings/notifications`
    }
  }
});
```

### Email Digest

A scheduled Cloud Function (Pub/Sub) runs once per hour and checks `notification_digest_queue` for users whose `next_send_at` has passed. It batches all pending notification IDs into a single email, clears the queue, and updates `last_sent_at`.

This means a user with `email_digest: daily` receives one email per day summarizing everything that happened, instead of an email per interaction.

---

## Queue-Based Architecture and Scalability

The queue (the `notification_queue` collection) is the central piece that makes this system reliable and scalable. Here is why each design decision was made:

**Why not write directly to `notifications` from the Cloud Function trigger?**

If the write to `notifications` fails (network issue, Firestore quota exceeded, function timeout), the notification is silently lost. With a queue, the notification document is the source of truth. Delivery is a separate concern. If delivery fails, `retry_count` increments and the record is retried. The notification is never lost.

**Why Firestore as the queue instead of a dedicated message queue (Pub/Sub, Redis)?**

The project is already Firebase-native. Adding a new infrastructure dependency (Redis, RabbitMQ) would require a separate paid service, configuration, and operational knowledge. Firestore's `onCreate` triggers on the `notification_queue` collection provide the same fan-out semantics as a message queue for this scale. If the platform grows to millions of daily notifications, migrating to Firebase Pub/Sub (already configured in `firebase.json`) is a natural next step.

**Throughput estimate for current scale:**

A tutorial platform with 10,000 active users and 100 tutorials published per day might generate roughly 5,000–20,000 notification events per day (assuming modest engagement). Firestore handles millions of writes per day comfortably. The queue design adds no bottleneck at this scale.

**At higher scale (100k+ users), the natural evolution is:**

```
Current:  Firestore trigger → Firestore queue → Cloud Function delivery
Future:   Firestore trigger → Pub/Sub topic → Cloud Function (fan-out workers)
                                            → in_app delivery worker
                                            → email delivery worker
                                            → push delivery worker
```

The data model does not need to change for this migration — only the transport layer changes.

---

## Example End-to-End Flow

**Scenario:** User B (`@bsmith`) comments on a tutorial owned by User A (`@alice`), who has email digest set to `daily` and `tutorial_upvote` muted.

```
1. @bsmith submits a comment
        ↓
2. Redux action writes comment to Firestore
   tutorials/{tutorial_id}/comments/{comment_id}
        ↓
3. Cloud Function onWrite fires
   - Determines event type: tutorial_comment
   - Resolves recipient: @alice (uid: abc123)
   - Reads notification_prefs for abc123
     → in_app_enabled: true
     → email_enabled: true
     → email_digest: daily
     → muted_types: ["tutorial_upvote"]
   - tutorial_comment is NOT in muted_types → proceed
   - priority: high → email channel: immediate (bypass digest)
        ↓
4. Writes to notification_queue:
   {
     recipient_uid: "abc123",
     actor_username: "bsmith",
     type: "tutorial_comment",
     priority: "high",
     channel: "both",
     content: "bsmith commented on your tutorial 'Intro to Redux'",
     tutorial_id: "tut_xyz",
     status: "pending",
     process_after: <now>
   }
        ↓
5. notification_queue onCreate triggers delivery function
        ↓
6. Delivery function runs:
   ┌─ In-app branch ─────────────────────────────────────┐
   │  Writes to notifications/{notification_id}           │
   │  with recipient_uid: "abc123"                        │
   └─────────────────────────────────────────────────────┘
   ┌─ Email branch ──────────────────────────────────────┐
   │  priority === high → immediate                       │
   │  Writes to cl_mail:                                  │
   │  { to: "alice@example.com",                          │
   │    template: "notificationEmailTemplate", ... }      │
   └─────────────────────────────────────────────────────┘
        ↓
7. Firebase Trigger Email Extension picks up cl_mail doc
   → sends email to alice@example.com
        ↓
8. @alice opens app
   - Real-time Firestore listener fires (onSnapshot)
   - Redux state updated → bell icon shows "1 unread"
   - Notification dropdown shows:
     "bsmith commented on your tutorial 'Intro to Redux'"
        ↓
9. @alice clicks notification
   - Navigates to /tutorial/tut_xyz
   - readNotification() dispatched
   - isRead: true, status: read written to Firestore
   - Blue unread indicator disappears
```

---

## What This Design Does Not Change

- The `NotificationBox` component UI requires only minor changes — add `actor_photoURL` display, use the `type` field to show a type-specific icon.
- The `readNotification` and `deleteNotification` actions stay identical.
- The `cl_mail` pipeline and Firebase Trigger Email Extension require no changes — new notification emails just write a new document type.
- The Redux reducer shape stays the same — `notifications.data.notifications` still holds the array.

The biggest code change is adding `recipient_uid` to the query in `getNotificationData` and moving notification creation from the client-side Redux action into a Cloud Function trigger.
