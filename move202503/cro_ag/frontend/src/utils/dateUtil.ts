/* eslint-disable prettier/prettier */
/**
 * ****** YYYY-YY-DD HH-MM-ss  **
 *  @params timestamp: 13**** | new Date() | Date()
 *console.log(dateFormat(1714528800000, 'YY-MM-DD HH:mm:ss'))
 *   @params format => YY：*，M：*，D：*，H：*，m：**，s：*，SSS：**  
 **/
export function dateFormat(
  timestamp: number | Date,
  format = 'YYYY-MM-DD HH:mm:ss'
): string {
  const date = new Date(timestamp)
  function fixedTwo(value: number): string {
    return value < 10 ? '0' + value : String(value)
  }
  let showTime = format
  if (showTime.includes('SSS')) {
    const S = date.getMilliseconds()
    showTime = showTime.replace('SSS', '0'.repeat(3 - String(S).length) + S)
  }
  if (showTime.includes('YY')) {
    const Y = date.getFullYear()
    showTime = showTime.includes('YYYY') ? showTime.replace('YYYY', String(Y)) : showTime.replace('YY', String(Y).slice(2, 4))
  }
  if (showTime.includes('M')) {
    const M = date.getMonth() + 1
    showTime = showTime.includes('MM') ? showTime.replace('MM', fixedTwo(M)) : showTime.replace('M', String(M))
  }
  if (showTime.includes('D')) {
    const D = date.getDate()
    showTime = showTime.includes('DD') ? showTime.replace('DD', fixedTwo(D)) : showTime.replace('D', String(D))
  }
  if (showTime.includes('H')) {
    const H = date.getHours()
    showTime = showTime.includes('HH') ? showTime.replace('HH', fixedTwo(H)) : showTime.replace('H', String(H))
  }
  if (showTime.includes('m')) {
    const m = date.getMinutes()
    showTime = showTime.includes('mm') ? showTime.replace('mm', fixedTwo(m)) : showTime.replace('m', String(m))
  }
  if (showTime.includes('s')) {
    const s = date.getSeconds()
    showTime = showTime.includes('ss') ? showTime.replace('ss', fixedTwo(s)) : showTime.replace('s', String(s))
  }
  return showTime
}
 
/**
 * ** ** *13****
 */
export function timeTransition(time: string) {
  const timestamp = Date.parse(`${new Date(time)}`)
  return timestamp
}