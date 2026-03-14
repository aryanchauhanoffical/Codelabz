import React, { useEffect, useState } from "react";
import { Typography, Button, Box } from "@mui/material";
import Avatar from "@mui/material/Avatar";
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

  useEffect(() => {
    getUserProfileData(id)(firebase, firestore, dispatch);
    return () => {};
  }, [id]);

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

  const getTime = timestamp => {
    return timestamp.toDate().toDateString();
  };

  const isSmall = size === "sm";
  const showFollowButton = profileData?.uid !== user?.uid;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        minWidth: 0
      }}
    >
      <Avatar
        sx={{
          height: isSmall ? "28px" : "40px",
          width: isSmall ? "28px" : "40px",
          flexShrink: 0,
          bgcolor: "#03AAFA",
          fontSize: isSmall ? "0.75rem" : "1rem"
        }}
      >
        {user?.photoURL && user.photoURL.length > 0 ? (
          <img
            src={user.photoURL}
            alt={user?.displayName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          user?.displayName?.[0]
        )}
      </Avatar>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          component="span"
          sx={{
            display: "block",
            fontWeight: 600,
            fontSize: isSmall ? "13px" : "15px",
            color: "text.primary",
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
              fontSize: isSmall ? "10px" : "12px",
              color: "text.secondary",
              fontWeight: 500
            }}
          >
            {getTime(timestamp)}
          </Typography>
        )}

        {showFollowButton && (
          <Button
            variant={isFollowed ? "outlined" : "contained"}
            onClick={followUser}
            disabled={isFollowed}
            size="small"
            disableElevation
            sx={{
              mt: 0.5,
              borderRadius: "50px",
              height: "22px",
              textTransform: "none",
              padding: "1px 12px",
              fontSize: "11px",
              fontWeight: 600,
              minWidth: 0,
              ...(isFollowed
                ? {
                    borderColor: "divider",
                    color: "text.disabled"
                  }
                : {
                    bgcolor: "#03AAFA",
                    "&:hover": { bgcolor: "#0290d4" }
                  })
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
