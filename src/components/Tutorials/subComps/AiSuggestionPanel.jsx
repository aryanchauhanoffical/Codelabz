import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Tooltip,
  Typography
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import TitleIcon from "@mui/icons-material/Title";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CodeIcon from "@mui/icons-material/Code";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import { useDispatch, useSelector } from "react-redux";
import { useFirebase, useFirestore } from "react-redux-firebase";
import {
  acceptAiSuggestion,
  clearAiSuggestions,
  rejectAiSuggestion,
  requestAiSuggestions
} from "../../../store/actions";

// ── Type metadata ─────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  title: {
    label: "Title",
    icon: <TitleIcon sx={{ fontSize: 14 }} />,
    color: "primary",
    description: "Improved step title"
  },
  content: {
    label: "Content",
    icon: <ArticleOutlinedIcon sx={{ fontSize: 14 }} />,
    color: "info",
    description: "Explanation improvement"
  },
  code: {
    label: "Code",
    icon: <CodeIcon sx={{ fontSize: 14 }} />,
    color: "success",
    description: "Code example"
  },
  formatting: {
    label: "Format",
    icon: <FormatListBulletedIcon sx={{ fontSize: 14 }} />,
    color: "secondary",
    description: "Formatting tip"
  }
};

// ── Single suggestion card ────────────────────────────────────────────────────

const SuggestionCard = ({
  suggestion,
  onAccept,
  onReject,
  accepting
}) => {
  const cfg = TYPE_CONFIG[suggestion.type] || TYPE_CONFIG.content;

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        mb: 1.5,
        overflow: "hidden"
      }}
    >
      {/* Card header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.25,
          bgcolor: "grey.50",
          borderBottom: "1px solid",
          borderColor: "divider"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            icon={cfg.icon}
            label={cfg.label}
            color={cfg.color}
            size="small"
            sx={{ height: 22, fontSize: "0.68rem", fontWeight: 700 }}
          />
          <Typography variant="caption" color="text.secondary">
            {cfg.description}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Accept — inserts into editor" arrow placement="top">
            <IconButton
              size="small"
              onClick={() => onAccept(suggestion)}
              disabled={accepting}
              sx={{
                color: "success.main",
                bgcolor: "success.50",
                width: 28,
                height: 28,
                "&:hover": { bgcolor: "success.100" }
              }}
            >
              <CheckIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reject — dismiss this suggestion" arrow placement="top">
            <IconButton
              size="small"
              onClick={() => onReject(suggestion.id)}
              sx={{
                color: "error.main",
                bgcolor: "error.50",
                width: 28,
                height: 28,
                "&:hover": { bgcolor: "error.100" }
              }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Suggestion content */}
      <Box sx={{ px: 2, py: 1.5 }}>
        {suggestion.type === "title" ? (
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ color: "text.primary" }}
          >
            {suggestion.suggestion}
          </Typography>
        ) : (
          <Box
            sx={{
              fontSize: "0.82rem",
              lineHeight: 1.6,
              color: "text.primary",
              "& pre": {
                bgcolor: "grey.100",
                borderRadius: 1,
                p: 1,
                overflowX: "auto",
                fontSize: "0.78rem"
              },
              "& code": { fontFamily: "monospace" },
              "& p": { my: 0.5 },
              "& ul, & ol": { pl: 2, my: 0.5 }
            }}
            dangerouslySetInnerHTML={{ __html: suggestion.suggestion }}
          />
        )}

        {/* Explanation */}
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 1,
            color: "text.secondary",
            fontStyle: "italic",
            borderTop: "1px solid",
            borderColor: "divider",
            pt: 0.75
          }}
        >
          {suggestion.explanation}
        </Typography>
      </Box>
    </Card>
  );
};

// ── Main panel ────────────────────────────────────────────────────────────────

const AiSuggestionPanel = ({
  open,
  onClose,
  tutorialTitle,
  stepTitle,
  stepContent,
  currentContent,
  tutorial_id,
  step_id,
  owner
}) => {
  const dispatch = useDispatch();
  const firebase = useFirebase();
  const firestore = useFirestore();

  const { loading, error, suggestions, suggestion_session_id } = useSelector(
    ({ ai }) => ai
  );

  const handleRequest = () => {
    requestAiSuggestions({
      tutorialTitle,
      stepTitle,
      stepContent,
      tutorial_id,
      step_id
    })(firebase, firestore, dispatch);
  };

  const handleAccept = suggestion => {
    acceptAiSuggestion(
      suggestion,
      currentContent,
      owner,
      tutorial_id,
      step_id,
      suggestion_session_id
    )(firebase, firestore, dispatch);
  };

  const handleReject = suggestion_id => {
    rejectAiSuggestion(
      suggestion_id,
      suggestion_session_id
    )(firebase, firestore, dispatch);
  };

  const handleClose = () => {
    clearAiSuggestions()(dispatch);
    onClose();
  };

  const hasSuggestions = suggestions.length > 0;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: { width: { xs: "100vw", sm: 420 }, display: "flex", flexDirection: "column" }
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
          borderColor: "divider",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: "white", fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={700} color="white">
            AI Suggestions
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose} sx={{ color: "white" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
        {/* Info card */}
        <Box
          sx={{
            bgcolor: "primary.50",
            border: "1px solid",
            borderColor: "primary.200",
            borderRadius: 1.5,
            px: 1.5,
            py: 1,
            mb: 2
          }}
        >
          <Typography variant="caption" color="text.secondary" lineHeight={1.5}>
            Powered by <strong>Gemini 1.5 Flash</strong>. Suggestions are
            generated from the current step's content.{" "}
            <strong>Accept</strong> to insert into the editor,{" "}
            <strong>Reject</strong> to dismiss.
          </Typography>
        </Box>

        {/* Generate button */}
        {!hasSuggestions && !loading && (
          <Button
            variant="contained"
            fullWidth
            startIcon={<AutoAwesomeIcon />}
            onClick={handleRequest}
            disabled={!stepContent}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              textTransform: "none",
              fontWeight: 600,
              mb: 2,
              py: 1.25,
              borderRadius: 2,
              "&:hover": {
                background: "linear-gradient(135deg, #5a6fd6 0%, #6a4292 100%)"
              }
            }}
          >
            Generate Suggestions
          </Button>
        )}

        {/* Loading */}
        {loading && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
              py: 6
            }}
          >
            <CircularProgress
              size={40}
              sx={{ color: "#764ba2" }}
            />
            <Typography variant="body2" color="text.secondary">
              Analyzing your step with Gemini...
            </Typography>
          </Box>
        )}

        {/* Error */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Suggestions */}
        {hasSuggestions && (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1.5
              }}
            >
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                {suggestions.length} SUGGESTION{suggestions.length !== 1 ? "S" : ""}
              </Typography>
              <Button
                size="small"
                startIcon={<AutoAwesomeIcon sx={{ fontSize: "14px !important" }} />}
                onClick={handleRequest}
                sx={{ fontSize: "11px", textTransform: "none" }}
              >
                Regenerate
              </Button>
            </Box>

            <Divider sx={{ mb: 1.5 }} />

            {suggestions.map(s => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onAccept={handleAccept}
                onReject={handleReject}
                accepting={loading}
              />
            ))}

            {/* All consumed */}
            {suggestions.length === 0 && !loading && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  All suggestions applied. Generate new ones anytime.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={handleRequest}
                  sx={{ mt: 2, textTransform: "none" }}
                >
                  Generate again
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default AiSuggestionPanel;
