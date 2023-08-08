const replaceAll =
  String.prototype.replaceAll ||
  function (searchValue, replaceValue) {
    return this.split(searchValue).join(replaceValue);
  };

const HTMLEscapeMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;'
};

const escapeHTML = text =>
  Object.keys(HTMLEscapeMap).reduce(
    (oldText, charToEscape) =>
      replaceAll.call(oldText, charToEscape, HTMLEscapeMap[charToEscape]),
    text
  );

export default escapeHTML;
