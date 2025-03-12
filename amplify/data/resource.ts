import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

import { chatHandler } from "./chatHandler/resource";
import { createKnowledge } from "./createKnowledge/resource";
import { getRetrieve } from "./getRetrieve/resource";

const schema = a
  .schema({
    // Define Data Category
    UserKnowledge: a
      .model({
        path: a.string().required(),
        key: a.string().required(),
        username: a.id().required(),
        abstract: a.string(),
        contents: a.hasMany("UserKnowledgeContent", "knowledgeID"),
      })
      .secondaryIndexes((index) => [index("username")])
      .authorization((allow) => allow.ownerDefinedIn("username")),

    UserKnowledgeContent: a
      .model({
        knowledge: a.belongsTo("UserKnowledge", "knowledgeID"),
        knowledgeID: a.id().required(),
        username: a.id().required(),
        page: a.string().required(),
        markdown: a.string(),
      })
      .authorization((allow) => allow.ownerDefinedIn("username")),

    // Define Lambda Functions
    createKnowledge: a
      .query()
      .arguments({
        identityID: a.string(),
        accessLevel: a.enum(["public", "protected", "private"]),
        uploadedKey: a.string(),
      })
      .returns(
        a.customType({
          status: a.string(),
        }),
      )
      .handler(a.handler.function(createKnowledge))
      .authorization((allow) => allow.authenticated()),

    getRetrieve: a
      .query()
      .arguments({
        message: a.string(),
      })
      .returns(
        a.customType({
          value: a.string(),
        }),
      )
      .handler(a.handler.function(getRetrieve))
      .authorization((allow) => allow.authenticated()),

    // Define AI Kit
    chat: a
      .conversation({
        aiModel: a.ai.model("Claude 3.5 Sonnet"),
        handler: chatHandler,
        systemPrompt:
          "あなたは優秀な秘書です。\n\
          回答を作成するための知見はtoolsを利用て取得してください。\n\
          toolsを利用する場合はユーザーからの入力原文を利用してください。\n\
          toolsを利用した場合は情報源を明示してください。\n\
          toolsを利用したが望ましい結果が得られない場合はその旨をユーザーに伝えて勝手な回答はしないでください。\n\
          質問には簡潔に答えてください。\n\
          回答には改行を含めてチャット形式で見やすさを重視してください。\n\
          ",
        tools: [
          a.ai.dataTool({
            name: "Retrieve",
            description: "ユーザーが保持する情報にアクセスすることができます。",
            query: a.ref("getRetrieve"),
          }),
        ],
      })
      .authorization((allow) => allow.owner()),
  })
  .authorization((allow) => [
    allow.resource(getRetrieve),
    allow.resource(createKnowledge),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
