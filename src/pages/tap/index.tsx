import useReceive from "hooks/socket/useReceive";
import { sendData } from "hooks/socket/useSend";
import useSocket from "hooks/socket/useSocket";
import { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const Socket: NextPage = () => {
  const { socket, isConnected } = useSocket("/admin");

  const [roomId, setRoomId] = useState("");
  const [users, setUsers] = useState(0);
  const [userClicks, setUserClicks] = useState<Record<string, number>>({});

  useReceive<{ roomId: string }>(socket, "room-id", ({ id, data }) => {
    setRoomId(data?.roomId);
  });

  useReceive<{ users: number }>(socket, "room-user", ({ id, data }) => {
    setUsers(data?.users);
  });

  useReceive(socket, "tap", ({ id, data }) => {
    setUserClicks((old) => {
      return {
        ...old,
        ...data,
      };
    });
  });

  return (
    <>
      <div>{isConnected ? "connected" : "not connected"}</div>
      <div>Room Id: {roomId}</div>
      <div>Users: {users}</div>
      <div>
        {Object.keys(userClicks).map((id) => {
          return (
            <div key={id}>
              {id}: {userClicks[id]}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Socket;
