import { describe, it, expect } from 'vitest'
import { validateNickname } from '../nickname'

describe('validateNickname', () => {
  it('한글·영문·숫자 2~10자는 통과한다', () => {
    expect(validateNickname('취준생1')).toBeNull()
    expect(validateNickname('Kim')).toBeNull()
    expect(validateNickname('가나다라마바사아자차')).toBeNull()
  })

  it('앞뒤 공백은 지우고 검사한다', () => {
    expect(validateNickname('  취준생  ')).toBeNull()
  })

  it('1자이거나 11자 이상이면 거절한다', () => {
    expect(validateNickname('a')).not.toBeNull()
    expect(validateNickname('가나다라마바사아자차카')).not.toBeNull()
  })

  it('공백·특수문자·이모지가 섞이면 거절한다', () => {
    expect(validateNickname('취 준생')).not.toBeNull()
    expect(validateNickname('취준생!')).not.toBeNull()
    expect(validateNickname('취준생😀')).not.toBeNull()
  })

  it('빈 값은 거절한다', () => {
    expect(validateNickname('')).not.toBeNull()
    expect(validateNickname('   ')).not.toBeNull()
  })
})
