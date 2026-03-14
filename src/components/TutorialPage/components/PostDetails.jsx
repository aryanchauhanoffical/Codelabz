import React, { useEffect } from "react";
import {
  Card,
  Typography,
  Box,
  Chip,
  Divider,
  Tooltip
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import TurnedInNotOutlinedIcon from "@mui/icons-material/TurnedInNotOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import User from "./UserDetails";
import { useDispatch } from "react-redux";
import { useFirebase, useFirestore } from "react-redux-firebase";
import { getUserProfileData } from "../../../store/actions";
import { HashLink } from "react-router-hash-link";
import { useParams } from "react-router-dom";
import TutorialLikesDislikes from "../../ui-helpers/TutorialLikesDislikes";

const TagChip = ({ label }) => (
  <Chip
    label={label}
    variant="outlined"
    size="small"
    sx={{
      height: "22px",
      fontSize: "0.72rem",
      fontWeight: 400,
      borderColor: "#03AAFA",
      color: "#03AAFA",
      "& .MuiChip-label": { px: "8px" }
    }}
  />
);

const ActionButton = ({ label, testId, children, component, to }) => {
  const button = (
    <Tooltip title={label} placement="top" arrow>
      <IconButton
        aria-label={label}
        data-testId={testId}
        size="small"
        sx={{
          color: "text.secondary",
          "&:hover": { color: "primary.main", bgcolor: "primary.50" }
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );

  if (component && to) {
    return <component to={to}>{button}</component>;
  }
  return button;
};

const PostDetails = ({ details }) => {
  const dispatch = useDispatch();
  const firebase = useFirebase();
  const firestore = useFirestore();
  const { id } = useParams();

  useEffect(() => {
    getUserProfileData(details.user)(firebase, firestore, dispatch);
  }, [details]);

  const hasTags = details?.tags?.length > 0;

  return (
    <>
      {details && (
        <Card
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider"
          }}
        >
          {/* Title */}
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.1rem", sm: "1.3rem", md: "1.5rem" },
              lineHeight: 1.3,
              color: "text.primary",
              mb: hasTags ? 1.5 : 2
            }}
          >
            {details?.title}
          </Typography>

          {/* Tags row */}
          {hasTags && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.75,
                mb: 2
              }}
            >
              {details.tags.map(tag => (
                <TagChip key={tag} label={tag} />
              ))}
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />

          {/* Author + actions row */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              gap: { xs: 1.5, sm: 0 }
            }}
          >
            <User id={details?.user} timestamp={details?.published_on} />

            {/* Actions pill */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                bgcolor: "grey.50",
                borderRadius: "50px",
                px: 1,
                py: 0.25,
                border: "1px solid",
                borderColor: "divider",
                flexShrink: 0
              }}
            >
              <TutorialLikesDislikes tutorial_id={details?.tutorial_id} />

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

              <HashLink
                to={`/tutorial/${id}#comments`}
                style={{ display: "flex" }}
              >
                <Tooltip title="Comments" placement="top" arrow>
                  <IconButton
                    aria-label="comments"
                    data-testId="CommentIcon"
                    size="small"
                    sx={{
                      color: "text.secondary",
                      "&:hover": { color: "primary.main" }
                    }}
                  >
                    <ChatOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </HashLink>

              <Tooltip title="Share" placement="top" arrow>
                <IconButton
                  aria-label="share"
                  data-testId="ShareIcon"
                  size="small"
                  sx={{
                    color: "text.secondary",
                    "&:hover": { color: "primary.main" }
                  }}
                >
                  <ShareOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Save" placement="top" arrow>
                <IconButton
                  aria-label="save"
                  data-testId="NotifIcon"
                  size="small"
                  sx={{
                    color: "text.secondary",
                    "&:hover": { color: "primary.main" }
                  }}
                >
                  <TurnedInNotOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="More options" placement="top" arrow>
                <IconButton
                  aria-label="more options"
                  data-testId="MoreIcon"
                  size="small"
                  sx={{
                    color: "text.secondary",
                    "&:hover": { color: "primary.main" }
                  }}
                >
                  <MoreVertOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Card>
      )}
    </>
  );
};

export default PostDetails;
