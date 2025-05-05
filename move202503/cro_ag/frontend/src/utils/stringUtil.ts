/* eslint-disable prettier/prettier */
/**
 * ******
 *
 */
class stringUtil {
 
    /**
     * **********undefined,****0,****false
     * @param str
     * @returns {boolean}
     */
    public static isEmpty = (str: any): boolean => {
      if (str === null || str === '' ||
        str === undefined || str.length === 0
      ) {
        return true
      }
      return false
   
    };
   
    /**
     * ************undefined,****0,****false
     * @param str
     * @returns {boolean}
     */
    public static isNotEmpty = (str: any): boolean => {
      if (
        str === null || str === '' ||
        str === undefined || str.length === 0
      ) {
        return false
      }
      return true
   
    };
  }
   
  export default stringUtil