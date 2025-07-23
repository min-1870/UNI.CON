class DummyRedis:
    def __init__(self):
        self._sets = {} # key → set of members
        self._zsets = {} # key → dict member → score

    # Set methods
    def smembers(self, key):
        return set(self._sets.get(key, set()))

    def sadd(self, key, *members):
        s = self._sets.setdefault(key, set())
        for m in members:
            s.add(str(m))
        return len(members)

    # Sorted-set methods
    def zadd(self, key, mapping):
        z = self._zsets.setdefault(key, {})
        for member, score in mapping.items():
            z[str(member)] = score
        return len(mapping)

    def zrem(self, key, *members):
        z = self._zsets.get(key, {})
        removed = 0
        for m in members:
            if str(m) in z:
                del z[str(m)]
                removed += 1
        return removed

    def zrevrange(self, key, start, stop):
        z = self._zsets.get(key, {})
        sorted_members = sorted(z.items(), key=lambda kv: (-kv[1], kv[0]))
        slice_ = sorted_members[start: stop + 1 if stop >= 0 else None]
        return [member for member, score in slice_]

    # Additional Redis methods
    def exists(self, key):
        return key in self._sets or key in self._zsets

    def expire(self, key, seconds):
        # no-op in dummy
        return True

    def zrevrangebyscore(self, key, max, min, start=0, num=None, withscores=False):
        z = self._zsets.get(key, {})
        # filter by score range
        filtered = [
            (member, score)
            for member, score in z.items()
            if float(min) <= score <= float(max)
        ]
        # sort by score descending then member lex
        sorted_filtered = sorted(filtered, key=lambda kv: (-kv[1], kv[0]))
        # apply offset and limit
        if num is not None:
            sliced = sorted_filtered[start:start + num]
        else:
            sliced = sorted_filtered[start:]
        # return bytes for member so .decode() works
        if withscores:
            return [
                (member.encode('utf-8'), float(score))
                for member, score in sliced
            ]
        return [
            member.encode('utf-8')
            for member, score in sliced
        ]

