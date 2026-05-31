// helpers/childrenHelper.js

function findObjectByKeyAndId(dataArray, keyToFind, idToFind) {
  if (!Array.isArray(dataArray)) return null;

  for (const subArray of dataArray) {
    if (!Array.isArray(subArray)) continue;

    const found = subArray.find(
      (item) =>
        item &&
        typeof item === "object" &&
        item.key === keyToFind &&
        String(item.id) === String(idToFind)
    );

    if (found) return found;
  }

  return null;
}

function normalizeDate(value) {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date)) return null;

  return date.toISOString().split("T")[0];
}

module.exports = {
  findObjectByKeyAndId,
  normalizeDate
};
