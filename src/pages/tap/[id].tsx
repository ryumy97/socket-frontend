import useReceive from "hooks/socket/useReceive";
import { sendData } from "hooks/socket/useSend";
import useSocket from "hooks/socket/useSocket";
import {
  GetServerSideProps,
  GetStaticPaths,
  GetStaticProps,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { useEffect, useRef } from "react";

const User: NextPage<InferGetServerSidePropsType<typeof getStaticProps>> = (
  props
) => {
  const { id } = props;

  console.log(id);

  const { socket, isConnected } = useSocket("/user");

  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (socket && isConnected) {
      sendData(socket, "set-room", {
        id,
      });
    }
  }, [id, isConnected, socket]);

  useEffect(() => {
    const button = buttonRef.current;

    if (button) {
      if (socket && isConnected) {
        const onClick = (event: MouseEvent) => {
          console.log("click");

          sendData(socket, "tap", {
            id: "hello",
          });
        };

        button.addEventListener("click", onClick);

        return () => {
          button.removeEventListener("click", onClick);
        };
      }
    }
  }, [socket, isConnected, id]);

  return (
    <button
      className="flex h-screen w-screen items-center justify-center"
      ref={buttonRef}
    >
      click me
    </button>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL;

  const data = (await fetch(`${url}/room`).then((res) =>
    res.json()
  )) as string[];

  const id = context?.params?.id as string;

  if (!data.find((item) => item === id)) {
    return {
      notFound: true,
    };
  }

  return {
    props: { id },
  };
};

export default User;
