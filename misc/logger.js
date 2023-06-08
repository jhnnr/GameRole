import config from "./config.js";
import { escapeMarkdown } from "./util.js";
import { client } from "../discord/bot.js";
import { sendShardMessage } from "./shardMessage.js";
import fs from 'fs';
import moment from 'moment';

const messagesToLog = [];
const logFilePath = 'logs.txt'; // Specify the path to the log file

const oldLog = console.log;
const oldError = console.error;

const shardString = () => client.shard ? `[${client.shard.ids[0]}] ` : "";

export const localLog = (...args) => {
  oldLog(shardString(), ...args);
  logToFile(shardString() + args.join(" "));
};

export const localError = (...args) => {
  oldError(shardString(), ...args);
  logToFile("> " + shardString() + args.map(e => (e instanceof Error ? e.stack : e.toString()).split('\n').join('\n> ' + shardString())).join(" "));
};

export const loadLogger = () => {
  console.log = (...args) => {
    oldLog(shardString(), ...args);
    if (config.logToChannel) messagesToLog.push(shardString() + escapeMarkdown(args.join(" ")));
    logToFile(shardString() + args.join(" "));
  };

  console.error = (...args) => {
    oldError(shardString(), ...args);
    if (config.logToChannel) messagesToLog.push("> " + shardString() + escapeMarkdown(args.map(e => (e instanceof Error ? e.stack : e.toString()).split('\n').join('\n> ' + shardString())).join(" ")));
    logToFile("> " + shardString() + args.map(e => (e instanceof Error ? e.stack : e.toString()).split('\n').join('\n> ' + shardString())).join(" "));
  };
};

export const addMessagesToLog = (messages) => {
  if (!messages.length) return;

  const channel = client.channels.cache.get(config.logToChannel);
  if (!channel) {
    messagesToLog.push(...messages);
  } else {
    messages.forEach(message => {
      logToFile(message);
    });
  }
};

export const sendConsoleOutput = () => {
  try {
    if (!client || client.destroyed || !messagesToLog.length) return;

    const channel = client.channels.cache.get(config.logToChannel);

    if (!channel && client.shard) {
      if (messagesToLog.length > 0)
        sendShardMessage({
          type: "logMessages",
          messages: [...messagesToLog],
        });
    } else if (channel) {
      while (messagesToLog.length) {
        let s = "";
        while (
          messagesToLog.length &&
          s.length + messagesToLog[0].length < 2000
        )
          s += messagesToLog.shift() + "\n";

        channel.send(s);
      }
    }

    messagesToLog.length = 0;
  } catch (e) {
    localError("Error when trying to send the console output to the channel!");
    localError(e);
  }
};

function logToFile(message) {
  moment.tz.setDefault("Asia/Singapore");
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const logMessage = `[${timestamp}] ${message}\n`;

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
}
