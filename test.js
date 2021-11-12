const a = new Map()

a.set('a', 1)
a.set('aa', {sessions: 'aa'})

console.log(!a.get('aa'))

for(const [k,v] of a) {
    console.log(k,v)
}