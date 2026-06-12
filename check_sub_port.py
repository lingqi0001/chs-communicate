import math

def v(t):
    return 8 * t**2 + 40 * t + 120 + 24 * math.sin(t / 6.0)

# integral from 0 to 8 using simpson's rule or exact calculus
# antiderivative V(t) = (8/3)*t^3 + 20*t^2 + 120*t - 144*cos(t/6)
def pos(t):
    return (8.0/3.0)*t**3 + 20.0*t**2 + 120.0*t - 144.0*math.cos(t/6.0)

diff = pos(8) - pos(0)
initial = 3479
ans = initial + diff
print("x(8) =", ans)
print("rounded =", round(ans))
