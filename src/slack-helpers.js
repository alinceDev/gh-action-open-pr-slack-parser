export class SlackBlockKit
{
  static divider() {
    return {
      type: 'divider'
    }
  }

  static link(text, url) {
    return `<${url}|${text}>`;
  }

  static getTextBlock(text) {
    return {
      type: 'mrkdwn',
      text: text
    }
  }

  static sectionWithText(text) {
    return [
      {
        type: 'section',
        text: this.getTextBlock(text)
      },
      {
        type: 'divider'
      }
    ]
  }
}
