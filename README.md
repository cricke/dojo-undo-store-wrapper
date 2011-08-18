# dojo-undo-store-wrapper

A wrapper that brings undo/redo functionality to a dojo.store

For efficiency reasons, mutating PUT operations, must be preceded by a call to store.changing(object)


## Examples:
	var master = new dojo.store.Memory({
		data: [
			{id: 1, name: "one", prime: false},
			{id: 2, name: "two", even: true, prime: true},
			{id: 3, name: "three", prime: true},
			{id: 4, name: "four", even: true, prime: false},
			{id: 5, name: "five", prime: true}
		]
	});
	var store = dojo.store.Undo(master);
	

### store.add
	store.add({
		id: 7,
		prime: true
	});
	var seven = store.get(7);
	
	// seven.prime == true
	
	store.undo();
	seven = store.get(7);

	// seven no longer exists (undefined)
		
	store.redo();
	seven = store.get(7);
	
	// seven's back


### store.remove
	store.remove(5);
	var five = store.get(5);
	
	// five's gone
	
	store.undo();
	five = store.get(5);
	
	// five's back
	
	store.redo();
	five = store.get(5);

	// five's gone again
	

### store.put
	var four = store.get(4);
	store.changing(four);
	four.square = true;
	store.put(four);
	
	four = store.get(4);
	
	// four.square == true
	
	store.undo();
	four = store.get(4);
	
	// four.square == undefined
	
	store.redo();
	four = store.get(4);
	
	// four.square == true
