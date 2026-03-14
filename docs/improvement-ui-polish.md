# UI Improvements — Feed Cards & Tutorial Page

This document explains the UX problems that were identified in the feed card components
and tutorial detail page, the solutions applied, and their impact on users.

No business logic was modified. All changes are in the presentation layer only.

---

## 1. Feed Card Layout — Tags Mixed with Action Icons

**Problem**

Tags, read time, and action icons (like, comment, share, save, more) were all rendered
in a single `CardActions` row. On cards with 2 or more tags the row overflowed and
action icons were pushed off-screen or wrapped unpredictably, especially on smaller screens.

```
Before:
[ HTML ]  [ CSS ]  10 min  👍  💬  📤  🔖  ⋮   ← all in one row, breaks on mobile
```

**Solution**

Separated into two clearly distinct rows with a `Divider` between them:

```
After:
Row 1 — tags:     [ HTML ]  [ CSS ]              10 min read
         ─────────────────────────────────────────────────────
Row 2 — actions:  👍                        💬  📤  🔖  ⋮
```

**Impact**

- Tags are readable at a glance without competing with icon buttons
- Action icons are always reachable regardless of how many tags a tutorial has
- Layout no longer breaks on small screens

**Files changed**
- `src/components/Card/CardWithPicture.jsx`
- `src/components/Card/CardWithoutPicture.jsx`

---

## 2. Feed Card Layout — No Text Truncation

**Problem**

Tutorial titles and descriptions expanded to their full length inside feed cards.
A tutorial with a long title pushed other cards down, making the feed height inconsistent
and hard to scan. Users had to read varying amounts of text per card to find what they wanted.

**Solution**

Applied `WebkitLineClamp` to clamp content at a maximum number of lines:

- Title: maximum 2 lines
- Description: maximum 3 lines

Overflow is hidden with an ellipsis.

**Impact**

- All feed cards now have consistent, predictable height
- Users can scan the feed without layout shifts between short and long tutorials
- Reduces cognitive load — users see the same amount of information per card

**Files changed**
- `src/components/Card/CardWithPicture.jsx`
- `src/components/Card/CardWithoutPicture.jsx`

---

## 3. Feed Card — No Click Affordance

**Problem**

Cards had no hover state. There was no visual signal that the entire card was clickable,
which can cause users to miss the interaction or feel uncertain.

**Solution**

Added a shadow elevation transition on hover:

```jsx
transition: "box-shadow 0.2s ease",
"&:hover": { boxShadow: 4 }
```

**Impact**

- Clear affordance that the card is interactive
- Smooth animation avoids a jarring visual jump

**Files changed**
- `src/components/Card/CardWithPicture.jsx`
- `src/components/Card/CardWithoutPicture.jsx`

---

## 4. Tutorial Page — Tags Inside Title Typography

**Problem**

In `PostDetails.jsx`, tag chips were rendered as inline elements *inside* the title `<Typography>`.
This broke the text flow and caused layout issues when a tutorial had multiple tags,
pushing chips mid-sentence or onto the same line as the title text.

```jsx
// Before — chips embedded inside title text
<Typography>
  {details?.title}
  {details?.tags?.map(tag => <Chip label={tag} />)}
</Typography>
```

**Solution**

Separated the title and tags into two independent blocks:

```jsx
// After — title and tags as separate rows
<Typography>{details?.title}</Typography>
<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
  {details?.tags?.map(tag => <Chip key={tag} size="small" label={tag} />)}
</Box>
```

**Impact**

- Title always renders cleanly as a full line
- Tags sit in their own row directly below, always readable regardless of title length
- Works correctly with any number of tags

**Files changed**
- `src/components/TutorialPage/components/PostDetails.jsx`

---

## 5. Tutorial Page — Follow Button Emphasis Backwards

**Problem**

The Follow button used `variant="contained"` (bold, filled, high-emphasis style) even when
the user was already following the author. A disabled filled button implies something is broken,
not that the action is already complete. The button that needs user attention ("Follow +")
looked identical to the state where no action was needed ("Following").

**Solution**

Follow button variant now reflects the actual state:

| User state | Variant | Reasoning |
|------------|---------|-----------|
| Not following | `contained` | High emphasis — calls user to action |
| Already following | `outlined` | Low emphasis — status indicator only |

**Impact**

- Users immediately understand which authors they are already following
- The button that needs attention stands out; the completed state recedes
- Consistent with standard UI convention (filled = primary action, outlined = secondary/status)

**Files changed**
- `src/components/TutorialPage/components/UserDetails.jsx`

---

## 6. Removed Deprecated `makeStyles` from Card Components

**Problem**

Both card components used `makeStyles` from `@mui/styles`, which is the MUI v4 styling API.
MUI v5 recommends the `sx` prop. Using `makeStyles` in a MUI v5 project adds an extra dependency
and separates styles from the markup that uses them, making the code harder to read and maintain.

**Solution**

Replaced all `makeStyles` class mappings with `sx` props colocated directly on each component.
Removed the `@mui/styles` import from both card files.

**Impact**

- Styles are colocated with markup — easier to read and modify
- Removes dependency on the legacy `@mui/styles` package in these files
- Consistent with how the rest of the MUI v5 components in the project are styled

**Files changed**
- `src/components/Card/CardWithPicture.jsx`
- `src/components/Card/CardWithoutPicture.jsx`

---

## Note on Prettier / Husky

The project runs `npm run format` (Prettier) automatically on every `git commit` via Husky.
Prettier config is in `.prettierrc`. If any of the changed files look reformatted after a commit,
that is the pre-commit hook applying the project's formatting rules — not a revert of the changes.

The hook is defined in `.husky/pre-commit`:

```sh
npm run lint
npm run format
```

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `src/components/Card/CardWithPicture.jsx` | Tags separated, text clamped, hover shadow, removed makeStyles |
| `src/components/Card/CardWithoutPicture.jsx` | Tags separated, text clamped, hover shadow, removed makeStyles |
| `src/components/TutorialPage/components/PostDetails.jsx` | Tags moved out of title into dedicated row |
| `src/components/TutorialPage/components/UserDetails.jsx` | Follow button variant corrected |
