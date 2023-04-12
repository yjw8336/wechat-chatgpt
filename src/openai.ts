import {
  Configuration,
  CreateImageRequestResponseFormatEnum,
  CreateImageRequestSizeEnum,
  OpenAIApi
} from "openai";
import fs from "fs";
import DBUtils from "./data.js";
import {config} from "./config.js";

const configuration = new Configuration({
  apiKey: config.openai_api_key,
  basePath: config.api,
});
const openai = new OpenAIApi(configuration);

/**
 * Get completion from OpenAI
 * @param username
 * @param message
 */
async function chatgpt(username:string,message: string): Promise<string> {
  // 先将用户输入的消息添加到数据库中
  console.log(`openai.ts:chatgpt:username: ${username}, message: ${message}`)
  DBUtils.addUserMessage(username, message);
  const messages = DBUtils.getChatMessage(username);

  let assistantMessage = "";
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: config.temperature,
    });
    if (response.status === 200) {
      assistantMessage = response.data.choices[0].message?.content.replace(/^\n+|\n+$/g, "") as string;
    }else{
      console.log(`Something went wrong,Code: ${response.status}, ${response.statusText}`)
    }
  }catch (error:any) {
    console.log("发生异常：" + error.message);
    console.log("堆栈跟踪：" + error.stack);
    return "";
  }
  return assistantMessage;
}

/**
 * Get image from Dall·E
 * @param username
 * @param prompt
 */
async function dalle(username:string,prompt: string) {
  const response = await openai.createImage({
    prompt: prompt,
    n:1,
    size: CreateImageRequestSizeEnum._256x256,
    response_format: CreateImageRequestResponseFormatEnum.Url,
    user: username
  }).then((res) => res.data).catch((err) => console.log(err));
  if (response) {
    return response.data[0].url;
  }else{
    return "Generate image failed"
  }
}

/**
 * Speech to text
 * @param username
 * @param videoPath
 */
async function whisper(username:string,videoPath: string): Promise<string> {
  const file:any= fs.createReadStream(videoPath);
  const response = await openai.createTranscription(file,"whisper-1")
    .then((res) => res.data).catch((err) => console.log(err));
  if (response) {
    return response.text;
  }else{
    return "Speech to text failed1"
  }
}

export {chatgpt,dalle,whisper};
