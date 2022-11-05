const {test} = require('tap');
const fs = require('fs');
const path = require('path');
const VirtualMachine = require('../../src/virtual-machine');
const {serialize} = require('../../src/serialization/sb3');

test('sb2 with hacked variable name blocks does not result in corrupted project', async t => {
    const vm = new VirtualMachine();
    await vm.loadProject(fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'tw-hacked-variable-names.sb2')));

    // Run the hacked block, which will result in a variable being created
    vm.runtime.greenFlag();
    vm.runtime._step();

    // Verify that the runtime-created variable
    const variableNames = Object.values(vm.runtime.targets[2].variables)
        .map(variable => variable.name);
    t.same(variableNames, ['getParam,argument report 2,r']);

    const json = serialize(vm.runtime);

    // Verify block was serialized correctly
    const serializedListFieldNames = Object.values(json.targets[2].blocks)
        .map(block => block.fields && block.fields.LIST)
        .filter(fields => !!fields)
        .map(listField => listField[0]);
    t.same(serializedListFieldNames, ['getParam,argument report 2,r']);

    // Verify that the newly created variable was serialized correctly
    const serializedListNames = Object.values(json.targets[2].lists)
        .map(i => i[0]);
    t.same(serializedListNames, ['getParam,argument report 2,r']);

    t.end();
});
