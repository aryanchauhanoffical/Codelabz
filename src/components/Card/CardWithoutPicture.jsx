import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { red } from "@mui/material/colors";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import TurnedInNotOutlinedIcon from "@mui/icons-material/TurnedInNotOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import { useDispatch, useSelector } from "react-redux";
import { useFirebase, useFirestore } from "react-redux-firebase";
import { getUserProfileData } from "../../store/actions";
import TutorialLikesDislikes from "../ui-helpers/TutorialLikesDislikes";

export default function CardWithoutPicture({ tutorial }) {
  const dispatch = useDispatch();
  const firebase = useFirebase();
  const firestore = useFirestore();

  useEffect(() => {
    getUserProfileData(tutorial?.created_by)(firebase, firestore, dispatch);
  }, [tutorial]);

  const user = useSelector(
    ({
      profile: {
        user: { data }
      }
    }) => data
  );

  const getTime = timestamp => {
    return timestamp.toDate().toDateString();
  };

  return (
    <Card
      sx={{
        margin: "0.5rem",
        borderRadius: "10px",
        transition: "box-shadow 0.2s ease",
        "&:hover": { boxShadow: 4 }
      }}
      data-testId="codelabz"
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: red[500] }}>
            {user?.photoURL && user?.photoURL.length > 0 ? (
              <img
                src={user?.photoURL}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              user?.displayName?.[0]
            )}
          </Avatar>
        }
        title={
          <>
            <Typography
              component="span"
              variant="body2"
              sx={{ fontWeight: 600 }}
              color="text.primary"
              data-testId="UserName"
            >
              {user?.displayName}
            </Typography>
            {tutorial?.owner && (
              <>
                {" for "}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ fontWeight: 600 }}
                  color="text.primary"
                  data-testId="UserOrgName"
                >
                  {tutorial?.owner}
                </Typography>
              </>
            )}
          </>
        }
        subheader={tutorial?.createdAt ? getTime(tutorial?.createdAt) : ""}
      />

      <Link to={`/tutorial/${tutorial?.tutorial_id}`}>
        <CardContent sx={{ pt: 0, pb: 1 }} data-testId="codelabzDetails">
          <Typography
            variant="h6"
            color="text.primary"
            data-testId="Title"
            sx={{
              fontWeight: 700,
              fontSize: "1rem",
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}
          >
            {tutorial?.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            component="p"
            data-testId="Description"
            sx={{
              mt: 0.5,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}
          >
            {tutorial?.summary}
          </Typography>
        </CardContent>
      </Link>

      {/* Tags + read time — own row, separated from action icons */}
      {tutorial?.tut_tags?.length > 0 && (
        <Box
          sx={{
            px: 2,
            pb: 1.5,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 0.5
          }}
        >
          {tutorial.tut_tags.map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              component="a"
              href="#chip"
              clickable
              variant="outlined"
              size="small"
            />
          ))}
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" color="text.secondary">
            10 min read
          </Typography>
        </Box>
      )}

      <Divider />

      <CardActions disableSpacing sx={{ px: 1, py: 0.5 }}>
        <TutorialLikesDislikes tutorial_id={tutorial?.tutorial_id} />
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="small" aria-label="comment" data-testId="CommentIcon">
          <ChatOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" aria-label="share" data-testId="ShareIcon">
          <ShareOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" aria-label="save" data-testId="NotifIcon">
          <TurnedInNotOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" aria-label="more" data-testId="MoreIcon">
          <MoreVertOutlinedIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );
}
