import { AuthUser } from "@aws-amplify/auth";
import {
  Button,
  Flex,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
  View,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import { useCallback, useEffect, useState } from "react";
import Markdown from "react-markdown";

import { type Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export const KnowledgeTab = ({ user }: { user?: AuthUser }) => {
  const [selectedItems, setSelectedItems] = useState<
    Schema["UserKnowledgeContent"]["type"][]
  >([]);
  const [knowledge, setKnowledge] =
    useState<Schema["UserKnowledge"]["type"][]>();
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

  const handleSelectItem = useCallback(
    async (id: string) => {
      const findItem = knowledge?.find((k) => k.id === id);
      const selected = await findItem?.contents();
      if (selected?.data) {
        // page番号で並び替え
        const items = selected.data.sort((a, b) => {
          return Number(a.page) - Number(b.page);
        });
        setSelectedItems(items);
      }
    },
    [knowledge],
  );

  const handleDeleteItem = useCallback(
    async (id: string) => {
      const checkSaveFlg = window.confirm("Are you sure you want to delete?");
      if (!checkSaveFlg) return;

      await client.models.UserKnowledge.delete({
        id: id,
      });
      setSelectedItems((prev) => prev.filter((item) => item.id !== id));
    },
    [handleFetchKnowledge],
  );

  useEffect(() => {
    handleFetchKnowledge();
  }, [handleFetchKnowledge]);

  return (
    <Flex direction="column" rowGap="l">
      <View flex={1} textAlign="end">
        <Button
          size={isSelected ? "large" : "small"}
          variation="menu"
          onClick={() =>
            isSelected ? setSelectedItems([]) : handleFetchKnowledge()
          }
        >
          {isSelected ? "Back" : "refetch"}
        </Button>
      </View>

      {isSelected ? (
        <View maxWidth={1280} overflow="auto">
          {selectedItems.map((content) => (
            <Markdown key={content.id}>{content.markdown}</Markdown>
          ))}
        </View>
      ) : (
        <Table highlightOnHover={true} variation="striped">
          <TableHead>
            <TableRow>
              <TableCell as="th">Title</TableCell>
              <TableCell as="th">Abstract</TableCell>
              <TableCell as="th">CreatedAt</TableCell>
              <TableCell as="th"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {knowledge?.map((item) => (
              <TableRow
                key={item.id}
                onClick={() => handleSelectItem(item.id)}
                style={{ cursor: "pointer" }}
              >
                <TableCell>
                  <Text fontSize="12px">{item.key}</Text>
                </TableCell>
                <TableCell>
                  <Text fontSize="12px">{item.abstract}</Text>
                </TableCell>
                <TableCell>
                  <Text fontSize="12px">{item.createdAt}</Text>
                </TableCell>
                <TableCell>
                  <Button
                    colorTheme="warning"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Flex>
  );
};
