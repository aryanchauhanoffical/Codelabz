import React from "react";
import { Box, Card, Chip, Divider, Typography } from "@mui/material";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import GifBoxOutlinedIcon from "@mui/icons-material/GifBoxOutlined";
import OndemandVideoOutlinedIcon from "@mui/icons-material/OndemandVideoOutlined";
import HtmlTextRenderer from "../../Tutorials/subComps/HtmlTextRenderer";

// Shared CSS applied to any Box that renders HTML step content.
// Styles every media tag that can appear in the rendered HTML, whether
// embedded via the MediaDrawer embed codes or typed manually by the author.
const CONTENT_MEDIA_SX = {
  // --- images & GIFs -------------------------------------------------------
  "& img": {
    display: "block",
    maxWidth: "100%",
    height: "auto",
    borderRadius: "8px",
    my: 1.5,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
  },
  // --- videos ---------------------------------------------------------------
  "& video": {
    display: "block",
    maxWidth: "100%",
    height: "auto",
    borderRadius: "8px",
    my: 1.5,
    bgcolor: "#000",
    outline: "none"
  },
  // --- paragraphs & inline text -------------------------------------------
  "& p": { mt: 0, mb: 1.25 },
  "& a": { color: "primary.main" },
  "& pre, & code": {
    fontFamily: "monospace",
    bgcolor: "grey.100",
    borderRadius: 1,
    px: 0.5,
    fontSize: "0.88em"
  }
};

// Detects what media types a step's HTML content contains.
// Used to render small indicator chips next to the step title.
const detectMediaTypes = html => {
  if (!html) return [];
  const types = [];
  if (/<img /i.test(html)) {
    if (/\.gif["'?]/i.test(html)) {
      types.push("gif");
    } else {
      types.push("image");
    }
  }
  if (/<video /i.test(html)) types.push("video");
  return types;
};

const MEDIA_CHIP_CONFIG = {
  image: { label: "Image", icon: <ImageOutlinedIcon />, color: "primary" },
  gif: { label: "GIF", icon: <GifBoxOutlinedIcon />, color: "success" },
  video: { label: "Video", icon: <OndemandVideoOutlinedIcon />, color: "secondary" }
};

const Tutorial = ({ steps }) => {
  return (
    <Card
      elevation={0}
      sx={{
        px: { xs: 2, sm: 3 },
        py: 2,
        my: 3,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2
      }}
    >
      {steps?.map((step, i) => {
        const mediaTypes = detectMediaTypes(step.content);
        const isLast = i === steps.length - 1;

        return (
          <Box key={step.id} id={step.id} data-testId="tutorialpageSteps">
            {/* Step heading */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 0.75,
                mb: 1
              }}
            >
              <Typography
                variant="subtitle1"
                component="h3"
                sx={{ fontWeight: 700, lineHeight: 1.4 }}
              >
                {i + 1}. {step.title}
              </Typography>

              {mediaTypes.map(type => {
                const cfg = MEDIA_CHIP_CONFIG[type];
                return (
                  <Chip
                    key={type}
                    label={cfg.label}
                    icon={cfg.icon}
                    color={cfg.color}
                    variant="outlined"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      "& .MuiChip-icon": { fontSize: 12 }
                    }}
                  />
                );
              })}
            </Box>

            {/* Step content with media-aware styles */}
            <Box sx={{ ...CONTENT_MEDIA_SX, lineHeight: 1.7, color: "text.primary" }}>
              <HtmlTextRenderer html={step.content} />
            </Box>

            {!isLast && <Divider sx={{ my: 2.5 }} />}
          </Box>
        );
      })}
    </Card>
  );
};

export default Tutorial;
