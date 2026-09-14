/**
 * @param {string} val 검증할 문자열
 * @returns {string} 통과시 빈문자열(''), 실패 시 에러메시지
 */

export const adminCode = (adminCode) => {
  if (!adminCode) {
    return "관리자 코드는 필수입니다.";
  }

  if (adminCode.length < 4 || adminCode.length > 20) {
    return "관리자 코드 형식에 맞지 않습니다.";
  }

  return "";
};

export const adminPassword = (adminPassword) => {
  if (!adminPassword) {
    return "비밀번호는 필수입니다.";
  }

  if (adminPassword.length < 4 || adminPassword.length > 20) {
    return "비밀번호 형식에 맞지 않습니다.";
  }

  return "";
};
