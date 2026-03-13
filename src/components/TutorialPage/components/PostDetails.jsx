import React, { useEffect } from "react";
import {
  Card,
  Typography,
  Box,
  Chip,
  Divider,
  Tooltip,
  IconButton
} from "@mui/material";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import TurnedInNotOutlinedIcon from "@mui/icons-material/TurnedInNotOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import User from "./UserDetails";
import { useDispatch, useSelector } from "react-redux";
import { useFirebase, useFirestore } from "react-redux-firebase";
import { getUserProfileData } from "../../../store/actions";
import { HashLink } from "react-router-hash-link";
import { useParams } from "react-router-dom";
import TutorialLikesDislikes from "../../ui-helpers/TutorialLikesDislikes";

/* ─── small presentational helpers ──────────────────────────────────────── */

const TagChip = ({ label }) => (
  <Chip
    label={label}
    size="small"
    sx={{
      height: 24,
      fontSize: "0.72rem",
      fontWeight: 500,
      bgcolor: "rgba(3, 170, 250, 0.08)",
      color: "#0293d9",
      border: "1px solid rgba(3, 170, 250, 0.25)",
      borderRadius: "6px",
      "& .MuiChip-label": { px: 1 }
    }}
  />
);

const ActionButton = ({ title, label, icon, testId, children }) => (
  <Tooltip title={title} arrow>
    <IconButton
      aria-label={label}
      data-testId={testId}
      size="small"
      sx={{
        color: "text.secondary",
        borderRadius: "8px",
        p: "6px",
        transition: "background 0.15s, color 0.15s",
        "&:hover": {
          bgcolor: "rgba(3, 170, 250, 0.08)",
          color: "#0293d9"
        }
      }}
    >
      {icon || children}
    </IconButton>
  </Tooltip>
);

/* ─── main component ─────────────────────────────────────────────────────── */

const PostDetails = ({ details }) => {
  const dispatch = useDispatch();
  const firebase = useFirebase();
  const firestore = useFirestore();
  const { id } = useParams();

  useEffect(() => {
    getUserProfileData(details.user)(firebase, firestore, dispatch);
  }, [details]);

  // kept exactly — same selector shape as before
  const user = useSelector(
    ({
      profile: {
        user: { data }
      }
    }) => data
  );

  if (!details) return null;

  const hasTags = Array.isArray(details.tags) && details.tags.length > 0;

  return (
    <Card
      elevation={0}
      sx={{
        px: { xs: 2, sm: 3 },
        pt: { xs: 2, sm: 2.5 },
        pb: { xs: 2, sm: 2 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
      }}
    >
      {/* ── Title ─────────────────────────────────────────────────────── */}
      <Typography
        variant="h5"
        component="h1"
        sx={{
          fontWeight: 700,
          fontSize: { xs: "1.15rem", sm: "1.3rem", md: "1.45rem" },
          lineHeight: 1.35,
          wordBreak: "break-word",
          color: "text.primary"
        }}
      >
        {details.title}
      </Typography>

      {/* ── Tags ──────────────────────────────────────────────────────── */}
      {hasTags && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.75,
            mt: 1.25
          }}
        >
          {details.tags.map(tag => (
            <TagChip key={tag} label={tag} />
          ))}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* ── Author + Actions row ──────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 1.5, sm: 1 }
        }}
      >
        {/* Author */}
        <User id={details.user} timestamp={details.published_on} />

        {/* Action icons */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 0.25,
            bgcolor: "grey.50",
            borderRadius: "10px",
            px: 0.75,
            py: 0.5,
            alignSelf: { xs: "flex-start", sm: "auto" }
          }}
        >
          <TutorialLikesDislikes tutorial_id={details.tutorial_id} />

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

          <HashLink to={`/tutorial/${id}#comments`} style={{ lineHeight: 0 }}>
            <ActionButton
              title="Jump to comments"
              label="jump to comments"
              testId="CommentIcon"
              icon={<ChatOutlinedIcon fontSize="small" />}
            />
          </HashLink>

          <ActionButton
            title="Share tutorial"
            label="share tutorial"
            testId="ShareIcon"
            icon={<ShareOutlinedIcon fontSize="small" />}
          />

          <ActionButton
            title="Save tutorial"
            label="save tutorial"
            testId="NotifIcon"
            icon={<TurnedInNotOutlinedIcon fontSize="small" />}
          />

          <ActionButton
            title="More options"
            label="more options"
            testId="MoreIcon"
            icon={<MoreVertOutlinedIcon fontSize="small" />}
          />
        </Box>
      </Box>
    </Card>
  );
};

export default PostDetails;
