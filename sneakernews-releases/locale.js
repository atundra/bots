module.exports = {
  welcome(locale = 'en') {
    switch (locale) {
      case 'en':
        return 'Welcome! Now I will send you the sneaker releases every day at 02 am New York time (10 am Moscow time).\nIf you want to change this use command /settime.';
      case 'ru':
        return 'Привет! Я буду присылыать тебе подборку релизов кроссовок каждый день в 10 утра по московскому времени.\nЕсли хочешь получать рассылку в другое время, используй команду /settime.';
      default:
        return 'Welcome! Now I will send you the sneaker releases every day at 02 am New York time (10 am Moscow time).\nIf you want to change this use command /settime.';
    }
  },

  setTime(locale = 'en') {
    switch (locale) {
      case 'en':
        return 'Send me a message in the format `/set HH:MM hh:mm`, where `HH:MM` is your current time and `hh:mm` is the time when you want to receive messages.\nFor example, if your current time is 4pm and you want to recieve messages at 10am – send me command `/set 16:00 10:00`.';
      case 'ru':
        return 'Отправь мне сообщение в формате `/set HH:MM hh:mm`, где `HH:MM` – твое текущее время, а `hh:mm` – желаемое время получение рассылки.\nНапример, если у тебя сейчас час дня и ты хочешь получать рассылку в 7 утра – отправь `/set 13:00 07:00`.';
      default:
        return 'Send me a message in the format `/set HH:MM hh:mm`, where `HH:MM` is your current time and `hh:mm` is the time when you want to receive messages.\nFor example, if your current time is 4pm and you want to recieve messages at 10am – send me command `/set 16:00 10:00`.';
    }
  },

  wrongFormat(locale = 'en') {
    switch (locale) {
      case 'en':
        return 'Wrong message format.';
      case 'ru':
        return 'Неверный формат сообщения.';
      default:
        return 'Wrong message format.';
    }
  },

  timeUpdated(locale = 'en', params) {
    switch (locale) {
      case 'en':
        return 'You will receive the newsletter at ${params.RECEIVING_TIME}.';
      case 'ru':
        return 'Вы будете получать рассылку в ${params.RECEIVING_TIME}.';
      default:
        return 'You will receive the newsletter at ${params.RECEIVING_TIME}.';
    }
  },

  alreadyRegistered(locale = 'en', params) {
    switch (locale) {
      case 'en':
        return `You are already subscribed. If you want to change the time for receiving news, use command /${params.SET_TIME_COMMAND}.`;
      case 'ru':
        return `Вы уже подписаны на рассылку. Если вы хотите изменить время получения рассылки, используйте команду /${params.SET_TIME_COMMAND}.`;
      default:
        return `You are already subscribed. If you want to change the time for receiving news, use command /${params.SET_TIME_COMMAND}.`;
    }
  },

  headerMessage(locale = 'en', params) {
    switch (locale) {
      case 'en':
        return `Today's releases:\n\n${params.RELEASES}`;
      case 'ru':
        return `Релизы на сегодня:\n\n${params.RELEASES}`;
      default:
        return `Today's releases:\n\n${params.RELEASES}`;
    }
  },

  notRegistered(locale = 'en', params) {
    switch (locale) {
      case 'en':
        return `You're not authorized. Send /start to register.`;
      case 'ru':
        return `Вы не авторизованы. Отправьте /start чтобы зарегистрироваться.`;
      default:
        return `You're not authorized. Send /start to register.`;
    }
  },

  noReleasesToday(locale = 'en', params) {
    switch (locale) {
      case 'en':
        return `No releases today.`;
      case 'ru':
        return `Сегодня нет релизов.`;
      default:
        return `No releases today.`;
    }
  },

  setTimeZone(locale = 'en', params) {
    switch (locale) {
      // case 'en':
      //   return `blah`;
      // case 'ru':
      //   return 'Сперва нужно понять, в каком часовом поясе вы находитесь. Варианты – отправить геолокацию, указать часовой пояс, указать текущее время';
      default:
        return `Для того, чтобы отправлять новости в подходящее вам время, нужно понять, в каком часовом поясе вы находитесь.\n\nСамый простой способ – отправьте мне текущую геолокацию, нажав на кнопку ниже. Если ваш телеграм клиент не поддерживает отправку геолокации, воспользуйтесь другими способами.\n\nЕсли вы знаете в каком часовом поясе вы находитесь, вы можете выбрать его своими руками. Для этого отправьте мне команду /${params.SELECT_TIMEZONE_COMMAND}.\n\nЕсли вы не знаете, в каком часовом поясе находитесь, отправьте мне команду /${params.GET_TIMEZONE_FROM_TIME_COMMAND}.`;
    }
  },

  selectTimeZone(locale = 'en', params) {
    switch (locale) {
      default:
        return `Отправьте мне ваш часовой пояс в формате UTC ([Всемирное координированное время](https://ru.wikipedia.org/wiki/Всемирное_координированное_время)) с помощью команды /${params.SET_UTC_COMMAND}.\n\nНапример, если вы находитесь в Непале – ваш часовой пояс +05:45, следовательно нужно отправить команду \`/${params.SET_UTC_COMMAND} +05:45\``;
    }
  },

  timezoneUpdated(locale = 'en', params) {
    switch (locale) {
      default:
        return `Ваш часовой пояс изменен. Теперь можно изменить время получения новостей с помощью команды ${params.SET_TIME_COMMAND}.`;
    }
  },

  noTimezone(locale = 'en', params) {
    switch (locale) {
      default:
        return `Пока не установлен часовой пояс я не смогу корректно определить время отправки новостей. Установите часовой пояс с помощью команды /${params.SET_TIMEZONE_COMMAND}`;
    }
  },

  sendMeYourTime(locale = 'en', params) {
    switch (locale) {
      default:
        return `Я могу определить ваш часовой пояс по тому, сколько у вас сейчас времени.\n\nОтправьте мне свое текущее время в формате \`HH:mm\` с помощью команды /${params.SET_TIMEZONE_FROM_TIME_COMMAND}.\n\nНапример, если ваше текущее время – 13:45, отправьте мне команду \`/${params.SET_TIMEZONE_FROM_TIME_COMMAND} 13:45\``;
    }
  }
};
