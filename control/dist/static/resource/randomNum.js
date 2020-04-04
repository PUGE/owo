function randomNum (minNum, maxNum) { 
  switch(arguments.length){ 
    case 1: 
      return parseInt(Math.random()*minNum+1,10); 
    break; 
    case 2: 
      return parseInt(Math.random()*(maxNum-minNum+1)+minNum,10); 
    break; 
      default: 
        return 0; 
      break; 
  } 
}


function randomGet (list, num) {
  var temp = []
  if (list.length < num) {
    return list
  }
  let randomList = new Set()
  while (randomList.size < num) {
    randomList.add(randomNum(0, list.length - 1))
  }
  let newList = []
  randomList.forEach(ind => {
    newList.push(list[ind])
  })
  return newList
}