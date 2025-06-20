/**
 * Lunch Launcher - Main entry point
 * Slack app for lunch matching system using Google Apps Script
 */

// Global variables for Google Apps Script
declare global {
  const Logger: {
    log(message: string): void;
  };
  const SpreadsheetApp: {
    openById(id: string): GoogleAppsScript.Spreadsheet.Spreadsheet;
  };
  const PropertiesService: {
    getScriptProperties(): GoogleAppsScript.Properties.Properties;
  };
  const UrlFetchApp: {
    fetch(url: string, options?: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions): GoogleAppsScript.URL_Fetch.HTTPResponse;
  };
  const Utilities: {
    newBlob(data: string, mimeType?: string): GoogleAppsScript.Base.Blob;
    jsonParse(json: string): unknown;
    jsonStringify(obj: unknown): string;
  };
}

// Types
interface LunchPreference {
  userId: string;
  username: string;
  timeSlots: string[];
  lunchPreferences?: string[];
  createdAt: Date;
}

interface LunchMatch {
  matchId: string;
  userIds: string[];
  timeSlot: string;
  createdAt: Date;
}

// Main function for Slack slash command
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  try {
    const payload = Utilities.jsonParse(e.postData.contents) as SlackPayload;

    switch (payload.type) {
      case 'url_verification':
        return ContentService.createTextOutput(payload.challenge);

      case 'event_callback':
        handleSlackEvent(payload.event);
        break;

      default:
        Logger.log(`Unknown payload type: ${payload.type}`);
    }

    return ContentService.createTextOutput('OK');
  } catch (error) {
    Logger.log(`Error in doPost: ${error}`);
    return ContentService.createTextOutput('Error', 500);
  }
}

// Handle Slack events
function handleSlackEvent(event: SlackEvent): void {
  switch (event.type) {
    case 'app_mention':
      handleAppMention(event);
      break;

    case 'interactive_message':
      handleInteractiveMessage(event);
      break;

    default:
      Logger.log(`Unhandled event type: ${event.type}`);
  }
}

// Handle app mention events
function handleAppMention(event: SlackAppMentionEvent): void {
  const message = event.text.toLowerCase();

  if (message.includes('lunch') || message.includes('ランチ')) {
    showLunchTimeSelection(event.channel, event.user);
  }
}

// Show lunch time selection modal
function showLunchTimeSelection(channel: string, userId: string): void {
  const timeSlots = [
    '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00'
  ];

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '🍽️ ランチの時間を選択してください！'
      }
    },
    {
      type: 'actions',
      elements: timeSlots.map(time => ({
        type: 'button',
        text: {
          type: 'plain_text',
          text: time
        },
        value: `lunch_time_${time}`,
        action_id: `select_lunch_time_${time}`
      }))
    }
  ];

  postMessage(channel, blocks);
}

// Post message to Slack
function postMessage(channel: string, blocks: unknown[]): void {
  const token = PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN');
  const url = 'https://slack.com/api/chat.postMessage';

  const payload = {
    channel,
    blocks,
    text: 'Lunch time selection'
  };

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    payload: Utilities.jsonStringify(payload)
  };

  UrlFetchApp.fetch(url, options);
}

// Slack API types
interface SlackPayload {
  type: string;
  challenge?: string;
  event?: SlackEvent;
}

interface SlackEvent {
  type: string;
  channel?: string;
  user?: string;
  text?: string;
}

interface SlackAppMentionEvent extends SlackEvent {
  type: 'app_mention';
  channel: string;
  user: string;
  text: string;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    doPost,
    handleSlackEvent,
    handleAppMention,
    showLunchTimeSelection,
    postMessage
  };
}
