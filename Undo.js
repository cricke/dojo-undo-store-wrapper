define(["dojo"], function(dojo) {
	// module:
	//		dojo/store/Undo
	// summary:
	//		A wrapper that brings undo/redo functionality to a dojo.store

dojo.getObject("store", true, dojo);

/*=====
dojo.declare("dojo.store.__UndoArgs", null, {
	constructor: function(){
		// summary:
		//		These are additional options for how undo/redo is handled.
		//		Not used at the moment.
	}
});
=====*/
dojo.store.Undo = function(masterStore, /*dojo.store.__UndoArgs*/ options){
	// summary:
	//		The Undo store wrapper takes a master store to which it adds
	//		undo-functionality. 
	//		Mutable operations made against this store will be tracked and can be undone.
	//		Prior to making PUT-operations on existing objects, the user must call
	//		store.changing(item)
	// masterStore:
	//		This is the store to which we want to add undo-functionality.
	// options:
	//		These are additional options for how undo/redo is handled.
	options = options || {};
	
	var undoStack = [];
	var redoStack = [];
	
	// Keeps track of mutated objects' original state
	var undoCacheStore = new dojo.store.Memory();
	
	function doAdd(object, directives){
		return dojo.when(masterStore.put(object, directives), function(result){
			var obj = typeof result == "object" ? result : object;
			undoStack.push({cmd:"add", obj:obj});
			redoStack = [];
			return result;
		});
	}	
	function doPut(newObject, oldObject, directives){
		return dojo.when(masterStore.put(newObject, directives), function(result){
			undoStack.push({cmd:"put", obj:oldObject});
			redoStack = [];
			return result;
		});
	}
	function doRemove(object, directives){
		var id = masterStore.getIdentity(object);
		return dojo.when(masterStore.remove(id, directives), function(result){
			undoStack.push({cmd:"remove", obj:object});
			redoStack = [];
			return result;
		});
	}
	
	return dojo.delegate(masterStore, {
		put: function(object, directives){
			// Note: Assumes store.add will eventually call store.put
			//			Is this always the case?
			
			var id = ("id" in directives) ? directives.id : masterStore.getIdentity(object);
			var hasId = typeof id != "undefined";
			
			if (hasId) {
				// If mutating an existing object, we need to know what the object looked like before its mutation
				return dojo.when(undoCacheStore.get(id), function(old) {
					if (old){
						return doPut(object, old, directives);
					}
					
					// If it's not in the cache, it could be a put new (an add)
					// So, we need to figure out if the object exists
					return dojo.when(masterStore.get(id), function(existing) {
						if (existing)
							throw new Error("Must call store.changing before a mutating store.put");
					
						// We're adding new object
						return doAdd(object, directives);
					});
				});
				
			} else {
				// Adding new object
				return doAdd(object, directives);
			}
		},
		remove: function(id, directives){
			// We need to store a complete copy of the object
			return dojo.when(masterStore.get(id), function(object) {
				return doRemove(object, directives);
			});
		},
		changing: function(object){
			undoCacheStore.put(dojo.clone(object));
		},
		undo: function(num_steps){
			var steps = num_steps || 1;
			var dfd = new dojo.Deferred();
			dfd.callback();
			
			for (var i=0; i < steps; i++) {
				(function() {
					var action = undoStack.pop();
					
					switch (action.cmd) {
						case "add":
							dfd.then(function(r) {
								var id = masterStore.getIdentity(action.obj);
								return masterStore.remove(id);
							});
							break;
							
						case "put":
							dfd.then(function(r) {
								// We need to figure out what the object looks like right now (before undo)
								var id = masterStore.getIdentity(action.obj);
								return dojo.when(masterStore.get(id), function(current) {
									var afterUndo = action.obj;
									action.obj = dojo.clone(current);
									return masterStore.put(afterUndo);
								});
								
							});
							break;
							
						case "remove":
							dfd.then(function(r) {
								return masterStore.add(action.obj);
							});
							break;
					}
					
					redoStack.push(action);
				})();
			}
			return dfd;
		},
		redo: function(num_steps){
			var steps = num_steps || 1;
			var dfd = new dojo.Deferred();
			dfd.callback();
			
			for (var i=0; i < steps; i++) {
				(function() {
					var action = redoStack.pop();
					
					switch (action.cmd) {
						case "add":
							dfd.then(function(r) {
								return masterStore.add(action.obj);
							});
							break;
							
						case "put":
							dfd.then(function(r) {
								// We need to figure out what the object looks like right now (before redo)
								var id = masterStore.getIdentity(action.obj);
								return dojo.when(masterStore.get(id), function(current) {
									var afterRedo = action.obj;
									action.obj = dojo.clone(current);
									return masterStore.put(afterRedo);
									
								});
							});
							break;
							
						case "remove":
							dfd.then(function(r) {
								var id = masterStore.getIdentity(action.obj);
								return masterStore.remove(id);
							});
							break;
					}
					
					undoStack.push(action);
				})();
			}
			return dfd;
		}
	});
};
/*=====
dojo.declare("dojo.store.Undo", null, {
	// example:
	//	|	var master = new dojo.store.Memory(data);
	//	|	var store = dojo.store.Undo(master);
	//
	add: function(object, directives){
		// summary:
		//		Add the given object to the store.
		// object: Object
		//		The object to add to the store.
		// directives: dojo.store.__AddOptions?
		//		Any additional parameters needed to describe how the add should be performed.
		// returns: Number
		//		The new id for the object.
	},
	put: function(object, directives){
		// summary:
		//		Put the object into the store (similar to an HTTP PUT).
		// object: Object
		//		The object to put to the store.
		// directives: dojo.store.__PutOptions?
		//		Any additional parameters needed to describe how the put should be performed.
		// returns: Number
		//		The new id for the object.
	},
	remove: function(id, directives){
		// summary:
		//		Remove the object with the specific id.
		// id: Number
		//		The identifier for the object in question.
		// directives: dojo.store.__RemoveOptions?
		//		Any additional parameters needed to describe how the remove should be performed.
	},
	changing: function(object){
		// summary:
		//		Informs the Undo-wrapper that the object is about to be changed
		// object: Object
		//		The object that is about to be changed
	},
	undo: function(num_steps){
		// summary:
		//		Undos the last 'num_steps' operation(s).
		// num_steps: Number
		//		The number of steps to undo.
	},
	redo: function(num_steps){
		// summary:
		//		Redos the last 'num_steps' undo(s).
		// num_steps: Number
		//		The number of steps to redo.
	}
});
=====*/
return dojo.store.Undo;
});
