import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Snackbar,
  Alert,
  Tooltip,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import { useFirebase, useFirestore } from "react-redux-firebase";
import { useDispatch, useSelector } from "react-redux";
import {
  clearTutorialImagesReducer,
  deleteTutorialMedia,
  uploadTutorialMedia
} from "../../../store/actions";

const ACCEPTED_TYPES = "image/*,video/mp4,video/webm,video/ogg,video/quicktime";

const MEDIA_TYPE_COLOR = {
  image: "primary",
  gif: "success",
  video: "secondary"
};

// Returns the HTML embed snippet to insert into the Quill editor
const buildEmbedCode = ({ url, name, mediaType }) => {
  if (mediaType === "video") {
    return `<video src="${url}" controls style="max-width:100%;height:auto;border-radius:6px;"></video>`;
  }
  return `<img src="${url}" alt="${name}" style="max-width:100%;height:auto;border-radius:4px;" />`;
};

const MediaCard = ({ item, onDelete, deleting }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildEmbedCode(item));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isVideo = item.mediaType === "video";
  const previewSrc = isVideo ? item.thumbnailUrl : item.url;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        mb: 1.5
      }}
    >
      {/* Thumbnail */}
      <Box
        sx={{
          width: 72,
          height: 72,
          flexShrink: 0,
          borderRadius: 1.5,
          overflow: "hidden",
          bgcolor: "grey.100",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative"
        }}
      >
        {previewSrc ? (
          <>
            <img
              src={previewSrc}
              alt={item.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
            {isVideo && (
              <PlayCircleOutlineIcon
                sx={{
                  position: "absolute",
                  color: "white",
                  fontSize: 28,
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))"
                }}
              />
            )}
          </>
        ) : (
          <PlayCircleOutlineIcon
            sx={{ color: "text.disabled", fontSize: 32 }}
          />
        )}
      </Box>

      {/* Info + actions */}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}
        >
          <Chip
            label={item.mediaType.toUpperCase()}
            size="small"
            color={MEDIA_TYPE_COLOR[item.mediaType] || "default"}
            sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }}
          />
          <Typography
            variant="caption"
            noWrap
            sx={{ color: "text.secondary", flex: 1, minWidth: 0 }}
          >
            {item.name}
          </Typography>
        </Box>

        {item.size && (
          <Typography
            variant="caption"
            sx={{ color: "text.disabled", display: "block", mb: 1 }}
          >
            {(item.size / 1024 / 1024).toFixed(2)} MB
          </Typography>
        )}

        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title={copied ? "Copied!" : "Copy embed code"} arrow>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopyIcon sx={{ fontSize: "14px !important" }} />}
              onClick={handleCopy}
              sx={{
                fontSize: "11px",
                px: 1,
                py: 0.25,
                height: 26,
                textTransform: "none",
                borderColor: copied ? "success.main" : undefined,
                color: copied ? "success.main" : undefined
              }}
            >
              {copied ? "Copied!" : "Copy embed"}
            </Button>
          </Tooltip>

          <Tooltip title="Delete" arrow>
            <IconButton
              size="small"
              onClick={() => onDelete(item)}
              disabled={deleting}
              sx={{
                color: "error.main",
                "&:hover": { bgcolor: "error.50" },
                width: 26,
                height: 26
              }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

const MediaDrawer = ({
  onClose,
  visible,
  owner,
  tutorial_id,
  mediaFiles,
  imageURLs
}) => {
  const firebase = useFirebase();
  const firestore = useFirestore();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [toast, setToast] = useState(null); // { message, severity }

  const uploading = useSelector(
    ({ tutorials: { images: { uploading } } }) => uploading
  );
  const uploading_error = useSelector(
    ({ tutorials: { images: { uploading_error } } }) => uploading_error
  );
  const deleting = useSelector(
    ({ tutorials: { images: { deleting } } }) => deleting
  );
  const deleting_error = useSelector(
    ({ tutorials: { images: { deleting_error } } }) => deleting_error
  );

  // Show toasts based on reducer state
  useEffect(() => {
    if (uploading === false && uploading_error === false) {
      setToast({ message: "Media uploaded successfully.", severity: "success" });
    } else if (uploading === false && uploading_error) {
      setToast({ message: uploading_error, severity: "error" });
    }
  }, [uploading, uploading_error]);

  useEffect(() => {
    if (deleting === false && deleting_error === false) {
      setToast({ message: "Media deleted.", severity: "success" });
    } else if (deleting === false && deleting_error) {
      setToast({ message: deleting_error, severity: "error" });
    }
  }, [deleting, deleting_error]);

  useEffect(() => {
    clearTutorialImagesReducer()(dispatch);
    return () => clearTutorialImagesReducer()(dispatch);
  }, [dispatch]);

  const handleFileChange = e => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    uploadTutorialMedia(owner, tutorial_id, files)(firebase, firestore, dispatch);
    // Reset input so the same file can be re-selected after deletion
    e.target.value = "";
  };

  const handleDelete = item => {
    deleteTutorialMedia(owner, tutorial_id, item)(firebase, firestore, dispatch);
  };

  // Merge mediaFiles (new) with legacy imageURLs (old), deduplicating by URL.
  const allMedia = (() => {
    const seen = new Set();
    const result = [];

    (mediaFiles || []).forEach(m => {
      seen.add(m.url);
      result.push(m);
    });

    // Legacy entries that haven't been migrated yet
    (imageURLs || []).forEach(img => {
      if (!seen.has(img.url)) {
        result.push({
          name: img.name,
          url: img.url,
          mediaType: "image",
          mimeType: "image/*",
          size: null,
          thumbnailUrl: null,
          uploadedAt: null
        });
      }
    });

    return result;
  })();

  return (
    <>
      <Drawer
        anchor="right"
        open={visible}
        onClose={onClose}
        data-testid="mediaDrawer"
        PaperProps={{
          sx: { width: { xs: "100vw", sm: 380 }, p: 0 }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider"
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Media
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ p: 2.5, overflowY: "auto", flex: 1 }}>
          {/* Upload zone */}
          <Box
            onClick={() => !uploading && fileInputRef.current?.click()}
            sx={{
              border: "2px dashed",
              borderColor: uploading ? "primary.main" : "divider",
              borderRadius: 2,
              p: 3,
              textAlign: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              bgcolor: uploading ? "primary.50" : "grey.50",
              transition: "all 0.2s",
              mb: 2.5,
              "&:hover": !uploading
                ? { borderColor: "primary.main", bgcolor: "primary.50" }
                : {}
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {uploading ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1
                }}
              >
                <CircularProgress size={28} />
                <Typography variant="body2" color="text.secondary">
                  Uploading...
                </Typography>
              </Box>
            ) : (
              <>
                <UploadFileIcon
                  sx={{ fontSize: 36, color: "text.disabled", mb: 0.5 }}
                />
                <Typography variant="body2" fontWeight={600}>
                  Click to upload
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Images (PNG, JPG, WebP), GIFs, Videos (MP4, WebM)
                </Typography>
              </>
            )}
          </Box>

          {/* How to use note */}
          <Box
            sx={{
              bgcolor: "info.50",
              border: "1px solid",
              borderColor: "info.200",
              borderRadius: 1.5,
              px: 1.5,
              py: 1,
              mb: 2.5
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Click <strong>Copy embed</strong> on any file, then paste the
              embed code directly into the editor.
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Media list */}
          {allMedia.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body2" color="text.disabled">
                No media uploaded yet.
              </Typography>
            </Box>
          ) : (
            allMedia.map((item, i) => (
              <MediaCard
                key={item.url || i}
                item={item}
                onDelete={handleDelete}
                deleting={deleting}
              />
            ))
          )}
        </Box>
      </Drawer>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          severity={toast?.severity || "info"}
          onClose={() => setToast(null)}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MediaDrawer;
