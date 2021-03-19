//from leetcode: https://leetcode.com/problems/permutation-in-string/discuss/639342/JavaScript-Simple-Sliding-Window-Solution

const checkInclusion = function(s1: any, s2: any) {
    if(s1.length > s2.length) return false;
    
    const s1CharCount = new Array(26).fill(0);
    const window = new Array(26).fill(0);
    
    for(let char of s1) {
        //'a'.charCodeAt() === 97;
        const idx = char.charCodeAt() - 97;
        s1CharCount[idx]++;
    }
    
    // construct window
    for(let i = 0; i < s1.length; i++) {
        const idx = s2[i].charCodeAt() - 97;
        window[idx]++;
    }
    
    let start = 0;
    let end = s1.length - 1;
    
    while(end < s2.length) {
        if(window.join('') === s1CharCount.join('')) return true;
        end++;
        if(end === s2.length) break;
        const startIdx = s2[start].charCodeAt() - 97;
        const endIdx = s2[end].charCodeAt() - 97;
        window[startIdx]--;
        window[endIdx]++;
        start++;
    }
    return false;
};
export default checkInclusion