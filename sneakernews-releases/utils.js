const log = require('./log');


const div = (val, by) => (val - val % by) / by;

const roundToNearest = (number, nearest) => Math.round(number / nearest) * nearest;

const getTimezonefromOffset = secondsOffset => {
  const sign = secondsOffset >= 0 ? '+' : '-';
  const roundedOffset = roundToNearest(Math.abs(secondsOffset), 30 * 60);
  const date = new Date(roundedOffset * 1000);
  const hour = `${date.getUTCHours()}`.padStart(2, '0');
  const minute = `${date.getUTCMinutes()}`.padStart(2, '0');
  return `${sign}${hour}:${minute}`;
};

module.exports = {
  div,
  roundToNearest,
  getTimezonefromOffset,

  getTimezoneFromUserTime(hour, minute) {
    const now = new Date();
    const userDate = new Date();
    userDate.setUTCHours(hour);
    userDate.setUTCMinutes(minute);
    const delta = userDate - now;
    let minuteDelta = div(delta, 1000 * 60);
    if (minuteDelta > (60 * 12)) {
      minuteDelta = -24 * 60 + minuteDelta;
    }
  
    if (minuteDelta <= (-60 * 12)) {
      minuteDelta = minuteDelta + 24 * 60;
    }
  
    return getTimezonefromOffset(minuteDelta * 60);
  },

  // @return {number} UTC offset in seconds
  parseTimezoneToOffset(timezone) {
    if (timezone === 'Z') {
      return 0;
    }

    const regexp = /([+-])(0[0-9]|1[0-2]):([03]0|45)$/;
    if (!regexp.test(timezone)) {
      log('ERROR PARSING TIMEZONE', timezone);
      return 0;
    }

    const [, sign, hour, minute] = regexp.exec(timezone);
    const now = new Date(0);
    now.setUTCHours(parseInt(hour, 10));
    now.setUTCMinutes(parseInt(minute, 10));
    const absOffset = +now / 1000;
    return sign === '-' ? -absOffset : absOffset;
  },
};
