# UI Polish — Feed Cards & Tutorial Page

## Summary

This pass improves real user-facing UX issues in the feed card components and tutorial detail page.
No business logic was modified — only presentation layer.

---

## 1. Problem: Tags mixed with action icons (Feed Cards)

**Before**

The bottom row of every feed card crammed tags, read time, likes, comment, share, save, and more icons
into a single `CardActions` row. On any card with 2+ tags the row overflowed and the action icons were
pushed off screen or wrapped chaotically.

```
[ HTML ]  [ CSS ]  10 min  ♥ 👍  💬  📤  🔖  ⋮
```

**After**

Two clearly separated rows with a `Divider` between them:

```
Row 1 (tags):    [ HTML ]  [ CSS ]           10 min read
──────────────────────────────────────────────────────
Row 2 (actions): ♥ 👍                   💬  📤  🔖  ⋮
```

**Files changed**
- `src/components/Card/CardWithPicture.jsx`
- `src/components/Card/CardWithoutPicture.jsx`

---

## 2. Problem: No text truncation on cards

**Before**

Title and description expanded to full length. A card with a long title pushed other cards down
and made the feed height inconsistent and hard to scan.

**After**

- Title: max 2 lines (`WebkitLineClamp: 2`)
- Description: max 3 lines (`WebkitLineClamp: 3`)

All feed cards now have uniform, predictable height. Users can scan the feed without jarring
layout shifts between short and long tutorials.

**Files changed**
- `src/components/Card/CardWithPicture.jsx`
- `src/components/Card/CardWithoutPicture.jsx`

---

## 3. Problem: Card hover gives no affordance

**Before**

Cards had no hover state. There was no visual signal that the card was clickable.

**After**

Cards animate to a raised shadow on hover:

```jsx
"&:hover": { boxShadow: 4 },
transition: "box-shadow 0.2s ease"
```

**Files changed**
- `src/components/Card/CardWithPicture.jsx`
- `src/components/Card/CardWithoutPicture.jsx`

---

## 4. Problem: Tags rendered inside title Typography

**Before** (`PostDetails.jsx`)

Tags were `<Chip>` elements placed *inside* the title `<Typography>`. This caused chips to render
inline mid-sentence, breaking the text flow and collapsing with long titles.

```jsx
<Typography>
  {details?.title}
  {details?.tags?.map(tag => <Chip label={tag} />)}
</Typography>
```

**After**

Title is its own block. Tags are in a dedicated `flexWrap` row directly below:

```jsx
<Typography>{details?.title}</Typography>
<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
  {details?.tags?.map(tag => <Chip key={tag} size="small" label={tag} />)}
</Box>
```

**Files changed**
- `src/components/TutorialPage/components/PostDetails.jsx`

---

## 5. Problem: Follow button emphasis is backwards

**Before** (`UserDetails.jsx`)

The Follow button used `variant="contained"` (bold, filled, high-emphasis) even when the user
was already following — the state where no action is needed. A disabled filled button implies
something is broken, not "all good".

**After**

| State | Variant | Meaning |
|-------|---------|---------|
| Not following | `contained` | Strong call to action — "click me" |
| Already following | `outlined` | Low emphasis — status indicator |

**Files changed**
- `src/components/TutorialPage/components/UserDetails.jsx`

---

## 6. Removed `makeStyles` from Card components

Both card components used the legacy `@mui/styles` `makeStyles` API (MUI v4 pattern).
Replaced with `sx` props throughout — no more style class mapping, styles colocated with markup.

**Files changed**
- `src/components/Card/CardWithPicture.jsx`
- `src/components/Card/CardWithoutPicture.jsx`

---

## Files Changed

| File | What Changed |
|------|-------------|
| `src/components/Card/CardWithPicture.jsx` | Tags row separated, text clamp, hover shadow, removed makeStyles |
| `src/components/Card/CardWithoutPicture.jsx` | Tags row separated, text clamp, hover shadow, removed makeStyles |
| `src/components/TutorialPage/components/PostDetails.jsx` | Tags moved out of title Typography into dedicated row |
| `src/components/TutorialPage/components/UserDetails.jsx` | Follow button variant corrected (outlined when following) |
