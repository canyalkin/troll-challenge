function Stacker(){

var
EMPTY = 0,
WALL = 1,
BLOCK = 2,
GOLD = 3;

var RIGHT = 0,
UP = 1,
LEFT = 2,
DOWN = 3,
facing = 0, 
direction = ["right", "up", "left", "down"];
    
var blockCnt=0;

var turnCnt=0;
var myMap=[];
var curRow=0, curCol=0;

var STATE_FIND_INDEX=0;
var EXPLORE_MAP=1;
var GOTO_GOLDEN=2;

var cur_state=0;

var min_row=0,max_row=0;
var min_col=0,max_col=0;
var colFound=0,rowFound=0;
var prevCell=null;
var newCell=null;

var initialPoint=null;
var targetPoint=null;
var targetAttemptCnt=0;
//var turn=1;

var queue=[];
var action_stack=[];
var visited=[];

var gold=null;
var staircase=null;
var isItFirstTime=1;
var onesNeeded=0;

var find_block=0;
var pick_block=1;
var block_destination=2;
var put_block=3;
var pick_current_block=4;
var action=null;
var build_staircase=0;

var current_stair=[];
var stairIndex=7;
var stairStep=2;

var pathList=[];

// Replace this with your own wizardry
this.turn = function(cell){
	
	// Pick an action randomly
	//console.log("Here!");
	
	
	if(turnCnt==0){
		init_map();
		//prevCell=new Object();
		//newCell=new Object();
		//prevCell.x=curRow;
		//prevCell.y=curCol;
	}/* else if(turnCnt==2){
		newCell.x=curRow;
		newCell.y=curCol;
	}else{
		
		prevCell.x=newCell.x;
		prevCell.y=newCell.y;
		newCell.x=curRow;
		newCell.y=curCol;
		
		console.log("prev row:",prevCell.x);
		console.log("prev col:",prevCell.y);
		console.log("new row:",curRow);
		console.log("new col:",curCol);
	} */
	turnCnt++;
	if(cur_state==STATE_FIND_INDEX){
        
		if(curCol<min_col){
			min_col=curCol;
		}
		if(curCol>max_col){
			max_col=curCol;
		}
		if(curRow<min_row){
			min_row=curRow;
		}
		if(curRow>max_row){
			max_row=curRow;
		}
		
		if(max_col-min_col+1==16 && !colFound ){//column found, troll must be on either left of right edge
			console.log("cur row:",curRow);
			console.log("cur col:",curCol);
            updateExactValueOfColumn();
			console.log("*cur row:",curRow);
			console.log("*cur col:",curCol);
		}
		if(max_row-min_row+1==16 && !rowFound){//row found, troll must be on up or down.
			updateExactValueOfRow();
			console.log("*cur row:",curRow);
			console.log("*cur col:",curCol);
		} 
		if(rowFound && colFound){//troll found both exact indexes of both row and column now, he needs to explore map.
			console.log("current row:",curRow," cur col:",curCol," max_col:",max_col," min_col:",min_col);
			console.log("max row:",max_row," min_row:",min_row);
			console.log("indexes are okay, go to next stage explore the grid.");
			cur_state=EXPLORE_MAP;
		}
		
		if(facing>0){//try to reach zero 
			if(!isObstacle(facing-1,cell)){
				turnRight();
				return go(facing,cell);
			}
		}
		
		if(!isObstacle(facing,cell)){//if there is no obstacle go that way
			return go(facing,cell);
		}else{// or turn left
			console.log("oops obstacle so turn left");
			turnLeft();
			if(isObstacle(facing,cell)){
				turnLeft();
				if(turnCnt==1 && isObstacle(facing,cell)){// in initial case if there is wall on three sides it should go back.
					turnLeft();
				}
			}
			return go(facing,cell);
		}
	}else if(cur_state==EXPLORE_MAP){
		saveCurrentAndNeighbours(cell);
		var numberLeft=numberToExplore();
		console.log("number to explore:",numberLeft);
        var surrCnt=countUndiscoveredSurrondingOfGold();
        console.log("number left surronding of gold",surrCnt," block cnt:",blockCnt );
		if( numberLeft<10 && /*(numberLeft<10 && turnCnt>300 )) &&*/ surrCnt==0 && blockCnt>35 && gold!=null){
			console.log("explored...");
			//alert("explored!");
			if(numberLeft>=1){
				console.log("assume as wall...")
				for(var i=1;i<17;i++){
					for(var j=1;j<17;j++){
						if(myMap[i][j].mapped==0){
                            console.log("-->row:",i," col:",j," assumed as wall");
							myMap[i][j].type=WALL;
							myMap[i][j].mapped=1;
						}
					}
				}
			}
			cur_state=GOTO_GOLDEN;
            if(curRow==gold.row-1 && curCol==gold.col){
                setNewTarget(gold.row+1,gold.col);
            }else{
                setNewTarget(gold.row-1,gold.col);
            }
			
			nList=getNeighbours(cell,curRow,curCol);
			action_stack.push(nList[nList.length-1]);
			for(var i=0;i<nList.length;i++){//actual search will start on next loop, just go closer
				visited[nList[i].row][nList[i].col]=0;
			}
			min_object=action_stack.pop();
            return move(min_object,cell);
			
		}
		if(targetPoint==null || targetPoint.mapped){
			console.log("23**target found***");
			getNewTarget();
            if(numberLeft==0){
                cur_state=GOTO_GOLDEN;
                setNewTarget(gold.row-1,gold.col);
            }
		}else if(targetPoint!=null && curRow==targetPoint.row && curCol==targetPoint.col){
			console.log("24**target found***");
			getNewTarget();
            if(numberLeft==0){
                cur_state=GOTO_GOLDEN;
                setNewTarget(gold.row-1,gold.col);
            }
		}
		if(targetAttemptCnt>0 && queue.length==0 && action_stack.length==0){
			console.log("can not reach to cell target");
		}
		targetAttemptCnt++;
        /***explore map with dfs**/
		visited[curRow][curCol]=1;
		var nList=getNeighbours(cell,curRow,curCol);
		var min_object=null;
		if(nList.length!=0){
			for(var i=0;i<nList.length;i++){//put closest neighbor first
				queue.unshift(nList[i]);
			}
			min_object=queue.shift();
			if(min_object.col==curCol && min_object.row==curRow ){
				if( queue.length>0)
					min_object=queue.shift();
				else{
					console.log("1) no elements in queue...");
				}
			}
		}else{
			//take from queue if it is not neighbour put again in to the queue than go back 
			var candidate_neighbour=new Object();				
			if(queue.length==0){//if no neighbor in queue than create a fake neighbor to reach (if block below) action_stack
				candidate_neighbour.row=curRow+1;
				candidate_neighbour.col=curCol+1;
				candidate_neighbour.fake=1;
			}else{
				candidate_neighbour=queue.shift();
			}
			if(!isNeighbour(cell,candidate_neighbour)){// if not neighbour than go back
				if(candidate_neighbour.fake === undefined){
					queue.unshift(candidate_neighbour);
				}
				if(action_stack.length==0){// if you cannot go back so you cannot reach that target, write it as a wall
					console.log("--hops no action in stack!!!");
					console.log("queue size:",queue.length);
					console.log("action_stack size:",action_stack.length);
					console.log("target point:",targetPoint.row," ",targetPoint.col);
					console.log("can not explore target point row:"+targetPoint.row+" col:"+targetPoint.col);
					myMap[targetPoint.row][targetPoint.col].type=WALL;
					myMap[targetPoint.row][targetPoint.col].mapped=1;
					targetPoint=null;
					if(numberToExplore()>0){//if more target set the new target since there is nothing in stack get neighbor and go
						getNewTarget();
						nList=getNeighbours(cell,curRow,curCol);
						action_stack.push(nList[nList.length-1]);
						for(var i=0;i<nList.length;i++){//actual search will start on next loop, just go closer
							visited[nList[i].row][nList[i].col]=0;
						}
					}else{//there is no place to explore go to gold
						console.log("****explored");
						cur_state=GOTO_GOLDEN;
						setNewTarget(gold.row-1,gold.col);
						nList=getNeighbours(cell,curRow,curCol);
						action_stack.push(nList[nList.length-1]);
						for(var i=0;i<nList.length;i++){//actual search will start on next loop, just go closer
							visited[nList[i].row][nList[i].col]=0;
						}
					}
				}
				min_object=action_stack.pop();//go back
				/**when we go back, we need to update queue to go other directions*/
				var i=0;
				while(action_stack.length>0 && queue.length>0 && !isNeighbour(action_stack[action_stack.length-1],queue[0])){
					var deletedItem=queue.shift();
					visited[deletedItem.row][deletedItem.col]=0;
				}
				/****/
				return move(min_object,cell);
			}else{
				min_object=candidate_neighbour;
			}
			
		}
		return moveBySavingAction(min_object,cell);
		
	}else if(cur_state==GOTO_GOLDEN){
	
		if(isItFirstTime){
			
			onesNeeded=createOutLineOfStairs();//create staircase around gold so calc. how many one blocks around it.
			action=null;
			if(onesNeeded==0){
				build_staircase=1;
			}
			isItFirstTime=0;
		}
		
		if(targetPoint!=null && action!=null){
			if(onesNeeded>0 && curRow==targetPoint.row && curCol==targetPoint.col && action==block_destination ){//it is on the destination
				action=put_block;
				onesNeeded--;
				if(onesNeeded==0){//now troll can build staircase
					build_staircase=1;
					action=null;
				}
				return drop();
			}
			
			if(onesNeeded>0 && curRow==targetPoint.row && curCol==targetPoint.col && action==pick_block ){
				console.log("i picked it.");
				pickBlockToDestinationForBuildingStairCase();
			}
			
			if(targetPoint!=null && curRow==targetPoint.row && curCol==targetPoint.col && action==find_block ){
				action=pick_block;
				return pickup();
			}
		}
		
		if(onesNeeded>=0 && action==pick_current_block){
				console.log("***i picked the current block.");
				pickBlockToDestinationForBuildingStairCase();
		}
		
		if(onesNeeded>0 && (action ==null || action==put_block) ) {
				var closestBlock = getClosestBlockCoordinates(cell);
				console.log("cur row",curRow," cur col:",curCol);
				console.log("closest Block row:",myMap[curRow][curCol].row," col:",myMap[curRow][curCol].col );
				console.log("closest Block type:",myMap[curRow][curCol].type," level:",myMap[curRow][curCol].level );
				console.log("closest Block",closestBlock.row,closestBlock.col);
				console.log("closest Block row:",myMap[closestBlock.row][closestBlock.col].row," col:",myMap[closestBlock.row][closestBlock.col].col );
				console.log("closest Block type:",myMap[closestBlock.row][closestBlock.col].type," level:",myMap[closestBlock.row][closestBlock.col].level );
				if(closestBlock.row==curRow && closestBlock.col==curCol){//if troll stands on closest block than pick it
					console.log("it is here i pick up then!");
					console.log("targetPoint is:",targetPoint)
					action=pick_current_block;
					return pickup();
				}
				setNewTarget(closestBlock.row,closestBlock.col);
				action=find_block;
		}
		
		if(build_staircase && (action==null || action==put_block) ){
			console.log("lets build the staircase");
			if(stairStep==8){//go to gold.
				var closestBlock = getClosestBlockCoordinates(cell);
				setNewTarget(closestBlock.row,closestBlock.col);
				action=find_block;
			}
			else if(8-stairStep!= countNumberOfSteps(stairStep)){//count blocks we have for step i.e. it must be 6 for 2nd step.
				var closestBlock = getClosestBlockCoordinates(cell);
				setNewTarget(closestBlock.row,closestBlock.col);
				action=find_block;
				if(closestBlock.row==curRow && closestBlock.col==curCol){//this is another state bec. when you pickup 
					console.log("I am on the closest block!!.");
					action=pick_current_block;
					return pickup();
				}
			}
		}
		
		if(build_staircase && action==pick_current_block){
			pickBlockToDestination();
		}
		
		if(build_staircase && curRow==targetPoint.row && curCol==targetPoint.col && action==find_block ){
			action=pick_block;
			return pickup();
		}
		
		if(build_staircase && curRow==targetPoint.row && curCol==targetPoint.col && action==pick_block ){
			pickBlockToDestination();//fills levels from the end side 1,2,2,2,2,2,2->1,2,2,2,2,2,3->1,2,2,2,2,3,3
		}
		
		if(build_staircase && curRow==targetPoint.row && curCol==targetPoint.col && action==block_destination ){
			action=put_block;
			current_stair[myMap[curRow][curCol].stair_index]++;
			if(8-stairStep== countNumberOfSteps(stairStep)){//if this level is ok build next level.
				stairStep++;
			}
			return drop();
		}
        /******MOVING ALGORITHM******/
        if(action==find_block || action==block_destination){
            var min_object=pathList.shift();
            return move(min_object,cell);
        }
        /************************/
	}
}

function updateExactValueOfColumn(){
    if(curCol<=0){
        curCol=1;
        colFound=1;
    }else if(curCol>0){
        curCol=16;
        colFound=1;
    }
}
function updateExactValueOfRow(){
    if(curRow<=0){
        curRow=1;
        rowFound=1;
    }else if(curRow>0){
        curRow=16;
        rowFound=1;
    }
}
    
function move(min_object,cell){
	if(min_object.row>curRow){
		return go(DOWN,cell);
	}
	if(min_object.row<curRow){
		return go(UP,cell);
	}
	if(min_object.col<curCol){
		return go(LEFT,cell);
	}
	if(min_object.col>curCol){
		return go(RIGHT,cell);
	}

}
function moveBySavingAction(min_object,cell){	
	if(min_object.row>curRow){
		var cur_object=new Object();
		cur_object.row=curRow;
		cur_object.col=curCol;
		action_stack.push(cur_object);
		return go(DOWN,cell);
	}
	if(min_object.row<curRow){
		var cur_object=new Object();
		cur_object.row=curRow;
		cur_object.col=curCol;
		action_stack.push(cur_object);
		return go(UP,cell);
	}
	if(min_object.col<curCol){
		var cur_object=new Object();
		cur_object.row=curRow;
		cur_object.col=curCol;
		action_stack.push(cur_object);
		return go(LEFT,cell);
	}
	if(min_object.col>curCol){
		var cur_object=new Object();
		cur_object.row=curRow;
		cur_object.col=curCol;
		action_stack.push(cur_object);
		return go(RIGHT,cell);
	}
}
					
function pickBlockToDestinationForBuildingStairCase(){
	action=block_destination;
	var item=null;
	for(var i=0;i<7;i++){
		if(staircase[i].level==0){
			item=staircase[i];
			break;
		}
	}
	console.log("take this item to:",item.row,item.col);
	setNewTarget(item.row,item.col);
}
			
function  pickBlockToDestination(){
				
	action=block_destination;
	if(stairStep==8){
		setNewTarget(gold.row,gold.col);
	}else{	
		var stairIndex=getIndexForStairs(stairStep);
		setNewTarget(staircase[stairIndex].row,staircase[stairIndex].col);
	}
					
}
					
function contains(item){
	for(var i=0;i<queue.length;i++){
		if(queue[i].row==item.row && queue[i].col==item.col){
			return 1;
		}
	}
	return 0;
}

			

function getIndexForStairs(stairStep){
	for(var i=6;i>=stairStep-1;i--){
		if(current_stair[i]!=stairStep){
			return i;
		}
	}
	return -1;
}

						
function countNumberOfSteps(stairStep){
	var cnt=0;
	for(var i=6;i>=stairStep-1;i--){
		if(current_stair[i]==stairStep){
			cnt++;
		}
	}
	return cnt;
}
			
function drop(){

	myMap[curRow][curCol].level++;
	if(myMap[curRow][curCol].type!=BLOCK)
		myMap[curRow][curCol].type=BLOCK;
	return "drop";
}
				
function pickup(){

	if(myMap[curRow][curCol].type!=BLOCK){
		alert("not a block!");
	}
	myMap[curRow][curCol].level--;
	if(myMap[curRow][curCol].level==0){
		myMap[curRow][curCol].type=EMPTY;
	}
	return "pickup";
}
							
function getClosestBlockCoordinates(cell){
	var min=10000;
	var minItem=new Object();
	for(var i=1;i<17;i++){
		for(var j=1;j<17;j++){
			if(myMap[i][j].type==BLOCK && myMap[i][j].level==1){
				var isOnStairs=0
				for(var k=0;k<staircase.length;k++){
					if(myMap[i][j].row==staircase[k].row && myMap[i][j].col==staircase[k].col )  {
						isOnStairs=1;
						break;
					}
				}
				if(!isOnStairs){
					var cord=new Object();
					cord.row=curRow;
					cord.col=curCol;
					var dist=calculateDistance(cord,myMap[i][j]);
					if(dist < min){
						min=dist;
						minItem.row=myMap[i][j].row;
						minItem.col=myMap[i][j].col;
					}
				}
			}
		}
	}
	return minItem;
}
								
function createOutLineOfStairs(){
	
	staircase=[];
	/*1. up side*/
	var numberOFOnes=0;
	
	var row=gold.row-1;
	var col=gold.col;
	if(myMap[row][col].level==1)
		numberOFOnes++;
	myMap[row][col].stair_index=0;
	staircase.push(myMap[row][col]);
	
	/*2. up left*/
	row=gold.row-1;
	col=gold.col-1;
	if(myMap[row][col].level==1)
		numberOFOnes++;
	myMap[row][col].stair_index=1;
	staircase.push(myMap[row][col]);
	
	/*3. left*/
	row=gold.row;
	col=gold.col-1;
	if(myMap[row][col].level==1)
		numberOFOnes++;
	myMap[row][col].stair_index=2;
	staircase.push(myMap[row][col]);
	
	/*4. left down*/
	row=gold.row+1;
	col=gold.col-1;
	if(myMap[row][col].level==1)
		numberOFOnes++;
	myMap[row][col].stair_index=3;
	staircase.push(myMap[row][col]);
	
	/*5. down*/
	row=gold.row+1;
	col=gold.col;
	if(myMap[row][col].level==1)
		numberOFOnes++;
	myMap[row][col].stair_index=4;
	staircase.push(myMap[row][col]);
	
	/*6. down right*/
	row=gold.row+1;
	col=gold.col+1;
	
	if(myMap[row][col].level==1)
		numberOFOnes++;
	myMap[row][col].stair_index=5;
	staircase.push(myMap[row][col]);
	
	/*7. right*/
	row=gold.row;
	col=gold.col+1;
	if(myMap[row][col].level==1)
		numberOFOnes++;
	myMap[row][col].stair_index=6;
	staircase.push(myMap[row][col]);
	
	console.log("staircase data structure created...");
	for(var i=0;i<7;i++){
		current_stair[i]=1;
	}
	return 7-numberOFOnes;
}

function setNewTarget(targetRow,targetCol){
	targetPoint=myMap[targetRow][targetCol];
	initialPoint=new Object();
	initialPoint.col=curCol;
	initialPoint.row=curRow;
    var astar=new AStar(myMap,initialPoint,targetPoint);		
    pathList=astar.search();
    
	//clear queue and stack
	queue=[];
	action_stack=[];
	if(targetPoint!=null)
	console.log("target point row",targetPoint.row," target point col:", targetPoint.col);
	targetAttemptCnt=0;
	for(var i=1;i<17;i++){
		visited[i]=[];
		for(var j=1;j<17;j++){
			visited[i][j]=0;
		}
	}
}

function getNewTarget(){
	targetPoint=getClosestTarget(curRow,curCol);
	//targetPoint=getFurthestTarget(curRow,curCol);
    //targetPoint=getFurthestTarget(17,17);
	initialPoint=new Object();
	initialPoint.col=curCol;
	initialPoint.row=curRow;
	//clear queue and stack
	queue=[];
	action_stack=[];
	if(targetPoint!=null)
		console.log("target point row",targetPoint.row," target point col:", targetPoint.col);
	targetAttemptCnt=0;
	for(var i=1;i<17;i++){
		visited[i]=[];
		for(var j=1;j<17;j++){
			visited[i][j]=0;
		}
	}
}
			
function isNeighbour(cell,candidate_neighbour){
	var cnt=0;
	if(curRow-1==candidate_neighbour.row && curCol==candidate_neighbour.col)
		cnt++;
	if(curRow+1==candidate_neighbour.row && curCol==candidate_neighbour.col)
		cnt++;
	if(curRow==candidate_neighbour.row && curCol+1==candidate_neighbour.col)
		cnt++;
	if(curRow==candidate_neighbour.row && curCol-1==candidate_neighbour.col)
		cnt++;
	
	if(cnt==1){
		return 1;
	}
		
	return 0;
		
}
		
function calculatePenalty(item1,item2){
	var penalty=0;
	if(cur_state==GOTO_GOLDEN){
		var diffCol=Math.abs(item1.col-item2.col);
		var diffRow=Math.abs(item1.row-item2.row);
		if(diffCol==0 && diffRow==0){
			penalty=0;
		}else if(diffRow==0){
			var startCol=item1.col;
			var endCol=item2.col;
			if(item2.col<item1.col){
				startCol=item2.col;
				endCol=item1.col;
			}
			for(var i=startCol+1;i<=endCol;i++){
				if(myMap[item1.row][i].type==WALL){
					penalty++;
				}
			}
		}else if(diffCol==0){
			var startRow=item1.row;
			var endRow=item2.row;
			if(item2.row<item1.row){
				startRow=item2.row;
				endRow=item1.row;
			}
			for(var i=startRow+1;i<=endRow;i++){
				if(myMap[i][item1.col].type==WALL){
					penalty++;
				}
			}

		}else{
			diffRow=diffRow/diffCol;
			diffCol=1;
			var rowWay=1;
			var colWay=-1;

			var startRow=item1.row;
			var startCol=item1.col;
			var endRow=item2.row;
			var endCol=item2.col;

			//way is item1 to item2
			if(item1.col<item2.col){
				colWay=1;
			}
			if(item1.row>item2.row){
				rowWay=-1;
			}
			while(startCol>=1 && startRow>=1 && colWay*startCol<endCol && rowWay*startRow<endRow){
				if(myMap[Math.floor(startRow)][startCol].type==WALL){
						penalty++;
				}
				startCol=startCol+(colWay)*diffCol;
				startRow=startRow+(rowWay)*diffRow;
			}			
		}	
	}
return 4*penalty;
}

function calculateDistance(item1,item2){
	//return Math.sqrt(Math.pow(item1.row-item2.row,2)+Math.pow(item1.col-item2.col,2));
	
	return Math.abs(item1.row-item2.row)+ Math.abs(item1.col-item2.col)+calculatePenalty(item1,item2);
	
}
	
function getNeighbours(cell,curRow,curCol){
	
	var list=[];
	

	if(cell.left.type!=WALL && Math.abs(cell.level-cell.left.level)<=1 && !visited[curRow][curCol-1]){
		var item=new Object();
		item.row=curRow;
		item.col=curCol-1;
		list.push(item);
	}
	if(cell.right.type!=WALL && Math.abs(cell.level-cell.right.level)<=1 && !visited[curRow][curCol+1]){
		var item=new Object();
		item.row=curRow;
		item.col=curCol+1;
		list.push(item);
	}
	if(cell.up.type!=WALL && Math.abs(cell.level-cell.up.level)<=1 && !visited[curRow-1][curCol]){
		var item=new Object();
		item.row=curRow-1;
		item.col=curCol;
		list.push(item);
	}
	if(cell.down.type!=WALL && Math.abs(cell.level-cell.down.level)<=1 && !visited[curRow+1][curCol]){
		var item=new Object();
		item.row=curRow+1;
		item.col=curCol;
		list.push(item);
	}
	list.sort(function(a, b) {
		var aToTarget=calculateDistance(a,targetPoint);
		var bToTarget=calculateDistance(b,targetPoint);
	return aToTarget - bToTarget;
	});
	
	list.reverse();
	return list;
}
							
function numberToExplore(){
	var cnt=0;
	for(var i=1;i<17;i++){
		for(var j=1;j<17;j++){
			if(myMap[i][j].mapped==0){
				cnt++;
			}
		}
	}
	return cnt;
}
				
function saveCurrentAndNeighbours(cell){
	if(!myMap[curRow][curCol].mapped){//cell it self
        myMap[curRow][curCol].level=cell.level;
        myMap[curRow][curCol].type=cell.type;
        myMap[curRow][curCol].mapped=1;
		if(myMap[curRow][curCol].level==8){
			gold=new Object();
			gold.row=curRow;
			gold.col=curCol;
		}
        if(myMap[curRow][curCol].type==BLOCK)
            blockCnt++;
	}
	if(!myMap[curRow][curCol+1].mapped){//right cell
		myMap[curRow][curCol+1].level=cell.right.level;
		myMap[curRow][curCol+1].type=cell.right.type;
		myMap[curRow][curCol+1].mapped=1;
		if(myMap[curRow][curCol+1].level==8){
            gold=new Object();
            gold.row=curRow;
            gold.col=curCol+1;
		}
         if(myMap[curRow][curCol+1].type==BLOCK)
            blockCnt++;
	}
		
	if(!myMap[curRow][curCol-1].mapped){//left cell
		myMap[curRow][curCol-1].level=cell.left.level;
		myMap[curRow][curCol-1].type=cell.left.type;
		myMap[curRow][curCol-1].mapped=1;
		if(myMap[curRow][curCol-1].level==8){
			gold=new Object();
			gold.row=curRow;
			gold.col=curCol-1;
		}
        if(myMap[curRow][curCol-1].type==BLOCK)
            blockCnt++;
	}
	if(!myMap[curRow+1][curCol].mapped){//down cell
		myMap[curRow+1][curCol].level=cell.down.level;
		myMap[curRow+1][curCol].type=cell.down.type;
		myMap[curRow+1][curCol].mapped=1;
		if(myMap[curRow+1][curCol].level==8){
			gold=new Object();
			gold.row=curRow+1;
			gold.col=curCol;
		}
        if(myMap[curRow+1][curCol].type==BLOCK)
            blockCnt++;
	}
		
	if(!myMap[curRow-1][curCol].mapped){//up cell
		myMap[curRow-1][curCol].level=cell.up.level;
		myMap[curRow-1][curCol].type=cell.up.type;
		myMap[curRow-1][curCol].mapped=1;
		if(myMap[curRow-1][curCol].level==8){
			gold=new Object();
			gold.row=curRow-1;
			gold.col=curCol;
		}
        if(myMap[curRow-1][curCol].type==BLOCK)
            blockCnt++;
	}
}
    
function countUndiscoveredSurrondingOfGold(){
    var cnt=7;    
    if(gold!=null){
        var row=gold.row;
        var col=gold.col;
        if(myMap[row-1][col].mapped==1){//N
           cnt--;
            
        }
        if(myMap[row-1][col-1].mapped==1){//NW
            cnt--;
            
        }
        if(myMap[row][col-1].mapped==1){//W
            cnt--;
            
        }
        if(myMap[row+1][col-1].mapped==1){//SW
            cnt--;
            
        }
        if(myMap[row+1][col].mapped==1){//S
            cnt--;
            
        }
        if(myMap[row+1][col+1].mapped==1){//SE
            cnt--;
            
        }
        if(myMap[row][col+1].mapped==1){//E
            cnt--;
        }
    } 
    return cnt;
}

function getUndiscoveredSurrondingOfGold(){
    var ret_cell=null;
    if(gold!=null){
        var row=gold.row;
        var col=gold.col;
        if(myMap[row-1][col].mapped==0){//N
            ret_cell=myMap[row-1][col];
            
        }else if(myMap[row-1][col-1].mapped==0){//NW
            ret_cell=myMap[row-1][col-1];
            
        }else if(myMap[row][col-1].mapped==0){//W
            ret_cell=myMap[row][col-1];
            
        }else if(myMap[row+1][col-1].mapped==0){//SW
            ret_cell=myMap[row+1][col-1];
            
        }else if(myMap[row+1][col].mapped==0){//S
            ret_cell=myMap[row+1][col];
            
        }else if(myMap[row+1][col+1].mapped==0){//SE
            ret_cell=myMap[row+1][col+1];
            
        }else if(myMap[row][col+1].mapped==0){//E
            ret_cell=myMap[row][col+1];
        }
    } 
    return ret_cell;
}
						
function getFurthestTarget(curRow,curCol){
	//myMap
	var maxDist=0;
	var ret_cell=null;
	var cur_max=0;
    var surr=getUndiscoveredSurrondingOfGold();
    
    if(surr!=null){
        return surr;
    }
    
	for(var i=1;i<17;i++){
		for(var j=1;j<17;j++){
			if( !(i==curRow && j==curCol) && myMap[i][j].mapped==0){
				cur_max=Math.abs(curRow-myMap[i][j].row)+Math.abs(curCol-myMap[i][j].col);
				if(cur_max>maxDist){
					maxDist=cur_max;
					ret_cell=myMap[i][j];
				}
			}
		}
	}
	return ret_cell;
					
}
					
function getClosestTarget(curRow,curCol){
	//myMap
	var minDist=1500;
	var ret_cell=null;
	
    var surr=getUndiscoveredSurrondingOfGold();
    
    if(surr!=null){
        return surr;
    }
    
    var cur_min=0;
	for(var i=1;i<17;i++){
		for(var j=1;j<17;j++){
			if( !(i==curRow && j==curCol) && myMap[i][j].mapped==0){
				cur_min=Math.abs(curRow-myMap[i][j].row)+Math.abs(curCol-myMap[i][j].col);
				if(cur_min<minDist){
					minDist=cur_min;
					ret_cell=myMap[i][j];
				}
			}
		}
	}
	return ret_cell;
}

function turnRight(){
	facing--;
	console.log("turn right performed!");
}
function turnLeft(){
	facing++;
	console.log("turn left performed!");
}

function go(dir,cell){
	dir=dir%4;
	if(dir==RIGHT){
		if(!isObstacle(dir,cell)){
			curCol++;
			return "right";
		}
	}else if(dir==DOWN){
		if(!isObstacle(dir,cell)){
			curRow++;
			return "down";
		}
	}else if(dir==LEFT){
		if(!isObstacle(dir,cell)){
			curCol--;
			return "left";
		}
	}else if(dir==UP){
		if(!isObstacle(dir,cell)){
			curRow--;
			return "up";
		}
	}
	return "error";	
}

function getLevel(row,col){
	return myMap[row][col].level;
}

function isBlock(row,col){
	if( myMap[row][col].type==BLOCK ){
		return 1;
	}
	return 0;
}
function isObstacleWall(row,col){
	if( myMap[row][col].type==WALL )
		return 1;
	return 0;
}
function isObstacle(dir,currentCell){
	dir=dir%4;
	if(dir==RIGHT){
		if( currentCell.right.type==WALL || Math.abs(currentCell.level-currentCell.right.level)>1){
			return 1;
		}
	}else if(dir==LEFT){
		if( currentCell.left.type==WALL  || Math.abs(currentCell.level-currentCell.left.level)>1){
			return 1;
		}
	}else if(dir==UP){
		if( currentCell.up.type==WALL ||  Math.abs(currentCell.level-currentCell.up.level)>1){
			return 1;
		}
	}else if(dir==DOWN){
		if( currentCell.down.type==WALL || Math.abs(currentCell.level-currentCell.down.level)>1){
			return 1;
		}
	}
	return 0;
}
									
function init_map(){
	for (var i=0;i<18;i++) {
		myMap[i] = [];
		myMap[i].push( new Array(18));
		for(var j=0;j<18;j++){
			var curCell=new Object();
			curCell.row=i;
			curCell.col=j;
			curCell.level=0;
			curCell.mapped=0;
			if(i==0 || i== 17 || j==0 || j==17){
				curCell.type=WALL;
				curCell.mapped=1;
				}
				myMap[i][j]=curCell;
				//console.log("myMap[",i," ",j,"]:",myMap[i][j].x,myMap[i][j].y);
			}
	}
}

/**************/

function AStar(myMap,startPoint,endPoint) {
	this.myMap=myMap;
	this.startPoint=startPoint;
	this.endPoint=endPoint;
	var grid=[];
	
	this.init = function() {
		for(var x = 1; x < 18; x++) {
			grid[x]=[];
			for(var y = 1; y < 18; y++) {
                grid[x][y]=new Object();
				grid[x][y].f = 0;
				grid[x][y].g = 0;
				grid[x][y].h = 0;
				grid[x][y].debug = "";
				grid[x][y].parent = null;
				grid[x][y].row=x;
				grid[x][y].col=y;
                grid[x][y].visited = 0;
                grid[x][y].closed = 0;
			}	
		}
	};
	
	this.heuristic=function(pos0, pos1) {
		// This is the Manhattan distance
		var d1 = Math.abs (pos1.row - pos0.row);
		var d2 = Math.abs (pos1.col - pos0.col);
		return d1 + d2;
	};
	
	this.neighbors = function(point) {
		var ret = [];
		var row=point.row;
		var col=point.col;

		if(this.myMap[row][col-1].type!=WALL && Math.abs(this.myMap[row][col].level-this.myMap[row][col-1].level)<=1){
			ret.push(grid[row][col-1]);
		}
		if(this.myMap[row][col+1].type!=WALL && Math.abs(this.myMap[row][col].level-this.myMap[row][col+1].level)<=1 ){
			ret.push(grid[row][col+1]);
		}
		if(this.myMap[row-1][col].type!=WALL && Math.abs(this.myMap[row][col].level-this.myMap[row-1][col].level)<=1 ){
			ret.push(grid[row-1][col]);
		}
		if(this.myMap[row+1][col].type!=WALL && Math.abs(this.myMap[row][col].level-this.myMap[row+1][col].level)<=1 ){
			ret.push(grid[row+1][col]);
		}	
		return ret;
	};
	
	this.search  =function() {
		this.init(grid);
 
		//var openList   = [];
        var openList= new Heap();
		openList.push(grid[startPoint.row][startPoint.col]);
 
		while(openList.getLength() > 0) {
 
			// Grab the lowest f(x) to process next
			//var lowInd = 0;
			//for(var i=0; i<openList.length; i++) {
			//	if(openList[i].f < openList[lowInd].f) { lowInd = i; }
			//}
			//var currentNode = openList[lowInd];
            var currentNode = openList.peek();
 
			// End case -- result has been found, return the traced path
			if(currentNode.row == endPoint.row && currentNode.col == endPoint.col) {
				var curr = currentNode;
				var ret = [];
				while(curr.parent) {
					ret.push(curr);
					curr = curr.parent;
				}
				return ret.reverse();
			}
 
			// Normal case -- move currentNode from open to closed, process each of its neighbors
			//this.removeNode(openList,currentNode);
            openList.pop();
            currentNode.closed=1;
			var neighbors = this.neighbors(currentNode);
 
			for(var i=0; i<neighbors.length;i++) {
				var neighbor = neighbors[i];
				if(neighbor.closed ) {
					continue;
				}
 
				// g score is the shortest distance from start to current node, we need to check if
				//	 the path we have arrived at this neighbor is the shortest one we have seen yet
				var gScore = currentNode.g + 1; // 1 is the distance from a node to it's neighbor
				var gScoreIsBest = false;
 
                 var beenVisited = neighbor.visited;
				if(!beenVisited || gScore<neighbor.g/*&&!this.isInList(openList,neighbor)*/) {
					// This the the first time we have arrived at this node, it must be the best
					// Also, we need to take the h (heuristic) score since we haven't done so yet
                    
                    neighbor.visited = 1;
                    neighbor.parent = currentNode;
                    neighbor.h = this.heuristic(neighbor, endPoint);
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;
					gScoreIsBest = true;
					if (!beenVisited) {
                        // Pushing to heap will put it in proper place based on the 'f' value.
                        openList.push(neighbor);
                    }
                    else {
                        // Already seen the node, but since it has been rescored we need to reorder it in the heap
                        openList.buildHeap();
                    }
				}
				
				
			}
		}
 
		// No result was found -- empty array signifies failure to find path
		return [];
	};
	
	this.removeNode =  function(list,item){
		var index=-1;
		for(var i=0;i<list.length;i++){
			if(list[i].row==item.row && list[i].col==item.col){
				index=i;
				break;
			}
		}
		if(index!=-1){
			list.splice(index, 1); 
		}
	};
	this.isInList  = function(list,item){
		for(var i=0;i<list.length;i++){
			if(list[i].row==item.row && list[i].col==item.col){
				return 1;
			}
		}
		return 0;
	};
}

/**************/
/***HEAP****/
    
function Heap(){
    
        this.cmp = (function(a, b){ return a.f - b.f; });
        this.length = 0;
        this.data = [];
    
        this.peek = function(){
            return this.data[0];
        };
    
        this.push = function(value){
  
            this.data.push(value);

            var pos = this.data.length - 1,
            parent, x;

            while(pos > 0){
                parent = (pos - 1) >>> 1;
                if(this.cmp(this.data[pos], this.data[parent]) < 0){
                    x = this.data[parent];
                    this.data[parent] = this.data[pos];
                    this.data[pos] = x;
                    pos = parent;
                }else
                    break;
            }
            return this.length++;
        };
    
        this.pop = function(){
            var last_val = this.data.pop(),
            ret = this.data[0];
            if(this.data.length > 0){
                this.data[0] = last_val;
                var pos = 0,
                last = this.data.length - 1,
                left, right, minIndex, x;
                while(1){
                    left = (pos << 1) + 1;
                    right = left + 1;
                    minIndex = pos;
                    if(left <= last && this.cmp(this.data[left], this.data[minIndex]) < 0) minIndex = left;
                    if(right <= last && this.cmp(this.data[right], this.data[minIndex]) < 0) minIndex = right;
                    if(minIndex !== pos){
                        x = this.data[minIndex];
                        this.data[minIndex] = this.data[pos];
                        this.data[pos] = x;
                        pos = minIndex;
                    }else break;
                }
            } else {
                ret = last_val;
            }
            this.length--;
            return ret;
        };
        this.getLength = function(){
            return this.length;
        };
        this.buildHeap = function(){
            for(var i=Math.floor(this.length/2);i>0;i--){
                this.percolateDown(i-1);
            }
        };
        this.percolateDown=function(i){
            var child;
            var tmp=this.data[i];
            for(; i*2+1<this.length;i=child){
                child=i*2+1;
                if(child!=this.length-1 && this.cmp(this.data[child+1],this.data[child])<0)
                    child++;
                if(this.cmp(this.data[child].f,tmp.f)<0)
                    this.data[i]=this.data[child];
                else
                    break;
            }
            this.data[i]=tmp;
        };
    
}
    
/****/

}




