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

  timeUpdated(locale = 'en') {
    switch (locale) {
      case 'en':
        return 'The time for receiving the newsletter has been changed.';
      case 'ru':
        return 'Время получения рассылки изменено.';
      default:
        return 'The time for receiving the newsletter has been changed.';
    }
  },

  alreadyRegistered(locale = 'en') {
    switch (locale) {
      case 'en':
        return 'You are already subscribed. If you want to change the time for receiving news, use command /settime.';
      case 'ru':
        return 'Вы уже подписаны на рассылку. Если вы хотите изменить время получения рассылки, используйте команду /settime.';
      default:
        return 'You are already subscribed. If you want to change the time for receiving news, use command /settime.';
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
        return `Сперва нужно понять, в каком часовом поясе вы находитесь.\n\nСамый простой способ – отправьте мне текущую геолокацию, нажав на кнопку ниже. Если ваш телеграм клиент не поддерживает отправку геолокации, воспользуйтесь другими способами.\n\nЕсли вы знаете в каком часовом поясе вы находитесь, вы можете выбрать его своими руками. Для этого отправьте мне команду /${params.SELECT_TIMEZONE_COMMAND}.\n\nЕсли вы не знаете, в каком часовом поясе находитесь, отправьте мне команду /${params.GET_TIMEZONE_FROM_TIME_COMMAND}.`;
    }
  },

  selectTimeZone(locale = 'en') {
    switch (locale) {
      default:
        return `Выберите свой часовой пояс`;
    }
  },
};
