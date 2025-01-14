'use client';

import { AuthUser, fetchAuthSession } from '@aws-amplify/auth';
import {
  Alert,
  AlertVariations,
  Button,
  Flex,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Text,
  View,
  withAuthenticator,
  WithAuthenticatorProps,
} from '@aws-amplify/ui-react';
import { AIConversation } from '@aws-amplify/ui-react-ai';
import { StorageManager } from '@aws-amplify/ui-react-storage';
import {
  createAmplifyAuthAdapter,
  createStorageBrowser,
} from '@aws-amplify/ui-react-storage/browser';
import '@aws-amplify/ui-react/styles.css';
import { generateClient } from 'aws-amplify/data';
import { useCallback, useState } from 'react';
import Markdown from 'react-markdown';

import { type Schema } from '@/amplify/data/resource';
import { useAIConversation } from '@/src/app/client';

const client = generateClient<Schema>();

const ChatTab = () => {
  const [
    {
      data: { messages },
      isLoading,
      hasError,
    },
    handleSendMessage,
  ] = useAIConversation('chat');

  return (
    <AIConversation
      messages={messages}
      isLoading={isLoading && !hasError}
      handleSendMessage={handleSendMessage}
    />
  );
};

const StorageTab = () => {
  const { StorageBrowser } = createStorageBrowser({
    config: createAmplifyAuthAdapter(),
  });
  const [creatingState, setCreatingState] = useState<AlertVariations>();

  const handleMakeKnowledge = useCallback(async ({ key }: { key?: string }) => {
    if (!key) {
      return;
    }

    setCreatingState('info');
    const session = await fetchAuthSession();
    const result = await client.queries.createKnowledge({
      identityID: session.identityId,
      accessLevel: 'protected',
      uploadedKey: key,
    });

    if (!result.data) {
      setCreatingState('error');
      return;
    }

    setCreatingState('success');
  }, []);

  const getAlertMessage = () => {
    switch (creatingState) {
      case 'info':
        return '情報を整理中です...';
      case 'error':
        return 'エラーが発生しました';
      case 'success':
        return '情報の整理が完了しました';
      default:
        return '';
    }
  };

  return (
    <Flex direction='column' rowGap='l'>
      <Alert variation={creatingState}>{getAlertMessage()}</Alert>
      <StorageManager
        acceptedFileTypes={['image/*', 'application/pdf']}
        accessLevel='protected'
        onUploadSuccess={handleMakeKnowledge}
        maxFileCount={1}
      />

      <StorageBrowser />
    </Flex>
  );
};

const KnowledgeTab = ({ user }: { user?: AuthUser }) => {
  const [selectedItems, setSelectedItems] = useState<
    Schema['UserKnowledgeContent']['type'][]
  >([]);
  const [knowledge, setKnowledge] =
    useState<Schema['UserKnowledge']['type'][]>();

  const isSelected = selectedItems.length > 0;
  const handleFetchKnowledge = useCallback(async () => {
    if (!user?.username) return;

    const result =
      await client.models.UserKnowledge.listUserKnowledgeByUsername({
        username: user.username,
      });
    if (!result.data) return;

    setKnowledge(result.data);
  }, [user]);

  return (
    <Flex direction='column' rowGap='l'>
      <Button
        size='small'
        variation='primary'
        onClick={() =>
          isSelected ? setSelectedItems([]) : handleFetchKnowledge()
        }
      >
        {isSelected ? 'Back' : 'Fetch Knowledge'}
      </Button>

      {isSelected ? (
        <Flex direction='column' rowGap='l'>
          {selectedItems.map((content) => (
            <Flex key={content.id} direction='column' rowGap='l'>
              <Markdown>{content.markdown}</Markdown>
            </Flex>
          ))}
        </Flex>
      ) : (
        <Table highlightOnHover={true} variation='striped'>
          <TableHead>
            <TableRow>
              <TableCell as='th'>Title</TableCell>
              <TableCell as='th'>Abstract</TableCell>
              <TableCell as='th'>CreatedAt</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {knowledge?.map((item) => (
              <TableRow
                key={item.id}
                onClick={async () => {
                  const findItem = knowledge.find((k) => k.id === item.id);
                  const selected = await findItem?.contents();
                  if (selected?.data) {
                    // page番号で並び替え
                    const items = selected.data.sort((a, b) => {
                      return Number(a.page) - Number(b.page);
                    });
                    setSelectedItems(items);
                  }
                }}
              >
                <TableCell>{item.key}</TableCell>
                <TableCell>
                  <Text fontSize='12px'>{item.abstract}</Text>
                </TableCell>
                <TableCell>{item.createdAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Flex>
  );
};

const App = ({ signOut, user }: WithAuthenticatorProps) => {
  return (
    <Flex justifyContent='center' alignItems='center'>
      <Flex
        direction='column'
        rowGap='l'
        flex={1}
        width='100%'
        maxWidth='1280px'
      >
        <Flex direction='row' rowGap='l'>
          <View flex={1} textAlign='center'>
            <h1>Personal RAG Chat</h1>
          </View>
          <Flex justifyContent='center' alignItems='center'>
            <Button size='small' variation='menu' onClick={signOut}>
              Sign out
            </Button>
          </Flex>
        </Flex>

        <Flex direction='row' rowGap='xxl'>
          <Tabs.Container defaultValue='1' flex={1}>
            <Tabs.List spacing='equal'>
              <Tabs.Item value='1'>Chat</Tabs.Item>
              <Tabs.Item value='2'>Storage</Tabs.Item>
              <Tabs.Item value='3'>Knowledge</Tabs.Item>
            </Tabs.List>
            <Tabs.Panel value='1'>
              <ChatTab />
            </Tabs.Panel>
            <Tabs.Panel value='2'>
              <StorageTab />
            </Tabs.Panel>
            <Tabs.Panel value='3'>
              <KnowledgeTab user={user} />
            </Tabs.Panel>
          </Tabs.Container>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default withAuthenticator(App);
