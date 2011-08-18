dojo.provide("dojo-undo-store-wrapper.tests.Undo");
dojo.require("dojo.store.Memory");
dojo.require("dojo-undo-store-wrapper.Undo");
(function(){
	var masterStore = new dojo.store.Memory({
		data: [
			{id: 1, name: "one", prime: false},
			{id: 2, name: "two", even: true, prime: true},
			{id: 3, name: "three", prime: true},
			{id: 4, name: "four", even: true, prime: false},
			{id: 5, name: "five", prime: true}
		]
	});
	var options = {};
	var store = dojo.store.Undo(masterStore, options);
	tests.register("dojo.tests.store.Undo",
		[
			function testUndoPutUpdate(t){
				var four = store.get(4);
				store.changing(four);
				four.square = true;
				store.put(four);
				
				t.t(store.get(4).square);
				t.t(masterStore.get(4).square);
				
				store.undo();
				t.is(store.get(4).square, undefined);
				t.is(masterStore.get(4).square, undefined);
				
				store.redo();
				t.t(store.get(4).square);
				t.t(masterStore.get(4).square);
								
			},
			function testUndoPutNew(t){
				store.put({
					id: 6,
					perfect: true
				});
				t.t(store.get(6).perfect);
				t.t(masterStore.get(6).perfect);
				
				store.undo();
				t.is(store.get(6), undefined);
				t.is(masterStore.get(6), undefined);
				
				store.redo();
				t.t(store.get(6).perfect);
				t.t(masterStore.get(6).perfect);
			},
			function testUndoAddNew(t){
				store.add({
					id: 7,
					prime: true
				});
				t.t(store.get(7).prime);
				t.t(masterStore.get(7).prime);
				
				store.undo();
				t.is(store.get(7), undefined);
				t.is(masterStore.get(7), undefined);
				
				store.redo();
				t.t(store.get(7).prime);
				t.t(masterStore.get(7).prime);
			},
			function testUndoDelete(t){
				store.remove(5);
				t.is(store.get(5), undefined);
				
				store.undo();
				t.t(store.get(5).prime);
				t.t(masterStore.get(5).prime);
				
				store.redo();
				t.is(store.get(5), undefined);
			},
			function testConsecutiveUndoPutUpdate(t){
				// Make an update
				var three = store.get(3);
				store.changing(three);
				three.third = true;
				store.put(three);
				
				t.t(store.get(3).third);
				t.t(masterStore.get(3).third);

				// Make another update
				three = store.get(3);
				store.changing(three);
				three.divine = true;
				store.put(three);
				
				t.t(store.get(3).divine);
				t.t(masterStore.get(3).divine);

				store.undo();
				
				// Second update should be undone, not the first
				t.is(store.get(3).divine, undefined);
				t.is(masterStore.get(3).divine, undefined);
				t.t(store.get(3).third);
				t.t(masterStore.get(3).third);

				store.undo();
				
				// Both should be undone
				t.is(store.get(3).divine, undefined);
				t.is(masterStore.get(3).divine, undefined);
				t.is(store.get(3).third, undefined);
				t.is(masterStore.get(3).third, undefined);

				store.redo(2);

				// Both should be redone
				t.t(store.get(3).divine);
				t.t(masterStore.get(3).divine);
				t.t(store.get(3).third);
				t.t(masterStore.get(3).third);
			},
			function testConsecutiveUndos(t){
				// PutUpdate
				var one = store.get(1);
				store.changing(one);
				one.first = true;
				store.put(one);

				// PutNew
				store.put({
					id: 8,
					eighth: true
				});
				
				// AddNew
				store.add({
					id: 9,
					ninth: true
				});
				
				store.remove(2);
				
				store.undo(2);
				
				// Delete and AddNew should be undone...
				t.t(store.get(2).even);
				t.t(masterStore.get(2).even);
				t.is(store.get(9), undefined);
				t.is(masterStore.get(9), undefined);
				
				// ... but PutNew and PutUpdate should not
				t.t(store.get(8).eighth);
				t.t(masterStore.get(8).eighth);
				t.t(store.get(1).first);
				t.t(masterStore.get(1).first);
				
				store.undo(2);
				
				// Everything should be undone
				t.t(store.get(2).even);
				t.t(masterStore.get(2).even);
				t.is(store.get(9), undefined);
				t.is(masterStore.get(9), undefined);
				t.is(store.get(8), undefined);
				t.is(masterStore.get(8), undefined);
				t.is(store.get(1).first, undefined);
				t.is(masterStore.get(1).first, undefined);
				
				store.redo(4);
				
				// Everything should be redone
				t.is(store.get(2), undefined);
				t.is(masterStore.get(2), undefined);
				t.t(store.get(9).ninth);
				t.t(masterStore.get(9).ninth);
				t.t(store.get(8).eighth);
				t.t(masterStore.get(8).eighth);
				t.t(store.get(1).first);
				t.t(masterStore.get(1).first);
			}
			
		]
	);
})();
