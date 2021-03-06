def two_sum(arr,targ):
    look_for = {}
    for n,x in enumerate(arr,1):
        try:
            return look_for[x], n
        except KeyError:
            look_for.setdefault(targ - x,n)

a = (2,7,1,15)
t = 9
print(two_sum(a,t)) 