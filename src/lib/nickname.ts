// 서버(Nickname 값 객체)와 같은 규칙. 서버가 원본이고 여기서는 요청 전에 빠르게 안내하려고 둔다.
const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]{2,10}$/

export const NICKNAME_RULE = '닉네임은 한글, 영문, 숫자 2~10자로 입력해주세요.'

export function validateNickname(raw: string): string | null {
  return NICKNAME_PATTERN.test(raw.trim()) ? null : NICKNAME_RULE
}
