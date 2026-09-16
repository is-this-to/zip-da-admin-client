const propertyPublicationStatus = Object.freeze({
  IN_REVIEW: "심사중",
  PUBLISHED: "공개 승인",
  REJECTED: "반려",
  HIDDEN: "숨김",
});

const getPropertyPublicationStatusName = (code) => propertyPublicationStatus[code] || code;

export default {
  propertyPublicationStatus,
  getPropertyPublicationStatusName,
};
