import { AuthUser } from "@aws-amplify/auth";
import { AIConversation } from "@aws-amplify/ui-react-ai";
import "@aws-amplify/ui-react/styles.css";
import Markdown from "react-markdown";

import { useAIConversation } from "@/src/app/client";
import { Button, Flex, View } from "@aws-amplify/ui-react";

export const ChatTab = ({ user }: { user?: AuthUser }) => {
  const [
    {
      data: { messages },
      isLoading,
      hasError,
    },
    handleSendMessage,
  ] = useAIConversation("chat");

  return (
    <Flex direction="column" rowGap="l">
      <View flex={1} textAlign="end">
        <Button
          size="small"
          variation="menu"
          onClick={() => window.location.reload()}
        >
          reload chat
        </Button>
      </View>
      <AIConversation
        messages={messages}
        isLoading={isLoading && !hasError}
        handleSendMessage={handleSendMessage}
        messageRenderer={{
          text: ({ text }) => <Markdown>{text}</Markdown>,
        }}
      />
    </Flex>
  );
};
