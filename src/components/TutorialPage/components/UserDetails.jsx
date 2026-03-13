import React, { useEffect, useState } from "react";
import { Typography, Button, Box, Avatar } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useFirebase, useFirestore } from "react-redux-firebase";
import { getUserProfileData } from "../../../store/actions";
import { isUserFollower } from "../../../store/actions/profileActions";
import { addUserFollower } from "../../../store/actions";

const User = ({ id, timestamp, size }) => {
  const dispatch = useDispatch();
  const firebase = useFirebase();
  const firestore = useFirestore();
  const [isFollowed, setIsFollowed] = useState(true);

  const isSmall = size === "sm";

  useEffect(() => {
    getUserProfileData(id)(firebase, firestore, dispatch);
    return () => {};
  }, [id]);

  // same selector shapes — unchanged
  const profileData = useSelector(({ firebase: { profile } }) => profile);
  const user = useSelector(
    ({
      profile: {
        user: { data }
      }
    }) => data
  );

  useEffect(() => {
    const checkIsFollowed = async () => {
      const status = await isUserFollower(
        profileData?.uid,
        user?.uid,
        firestore
      );
      setIsFollowed(status);
    };
    if (id && user && profileData) {
      checkIsFollowed();
    }
    return () => {};
  }, [profileData, user]);

  const followUser = async () => {
    await addUserFollower(profileData, user, firestore);
  };

  const getTime = timestamp => timestamp.toDate().toDateString();

  const showFollowButton = profileData?.uid !== user?.uid;

  const avatarSize = isSmall ? 28 : 40;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.25,
        minWidth: 0 /* lets long names truncate instead of overflowing */
      }}
    >
      {/* ── Avatar ──────────────────────────────────────────────────── */}
      <Avatar
        sx={{
          width: avatarSize,
          height: avatarSize,
          flexShrink: 0,
          fontSize: isSmall ? "0.7rem" : "1rem",
          bgcolor: "#0293d9"
        }}
      >
        {user?.photoURL && user.photoURL.length > 0 ? (
          <img
            src={user.photoURL}
            alt={user.displayName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          user?.displayName?.[0]?.toUpperCase()
        )}
      </Avatar>

      {/* ── Name / date / follow ────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.25,
          minWidth: 0
        }}
      >
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: isSmall ? "0.8rem" : "0.95rem",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
          data-testId="tutorialpageAuthorName"
        >
          {user?.displayName}
        </Typography>

        {timestamp && (
          <Typography
            sx={{
              fontSize: isSmall ? "0.65rem" : "0.75rem",
              color: "text.secondary",
              fontWeight: 500,
              lineHeight: 1.2
            }}
          >
            {getTime(timestamp)}
          </Typography>
        )}

        {showFollowButton && (
          <Button
            variant="contained"
            disableElevation
            onClick={followUser}
            disabled={isFollowed}
            size="small"
            sx={{
              mt: 0.5,
              borderRadius: "50px",
              height: 22,
              fontSize: "0.7rem",
              textTransform: "none",
              px: 1.5,
              py: 0,
              minWidth: 0,
              alignSelf: "flex-start",
              bgcolor: isFollowed ? "grey.200" : "#03AAFA",
              color: isFollowed ? "text.secondary" : "#fff",
              boxShadow: "none",
              "&:hover": {
                bgcolor: isFollowed ? "grey.300" : "#0293d9",
                boxShadow: "none"
              },
              "&.Mui-disabled": {
                bgcolor: "grey.100",
                color: "text.disabled"
              }
            }}
          >
            {isFollowed ? "Following" : "Follow +"}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default User;
