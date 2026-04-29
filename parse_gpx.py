import re, json, math

with open('clasica2026_2_fixed.gpx','r') as f:
    gpx = f.read()

pts = re.findall(r'lat="(.+?)" lon="(.+?)"><ele>(.+?)</ele>', gpx)
print(f'Total points: {len(pts)}')

def haversine(lat1,lon1,lat2,lon2):
    R=6371000
    p=math.pi/180
    a=math.sin((lat2-lat1)*p/2)**2+math.cos(lat1*p)*math.cos(lat2*p)*math.sin((lon2-lon1)*p/2)**2
    return 2*R*math.asin(math.sqrt(a))

# Build distance/elevation arrays
cumDist = [0]
for i in range(1,len(pts)):
    d = haversine(float(pts[i-1][0]),float(pts[i-1][1]),float(pts[i][0]),float(pts[i][1]))
    cumDist.append(cumDist[-1]+d)

eles = [float(p[2]) for p in pts]
totalKm = cumDist[-1]/1000
print(f'Total dist: {totalKm:.1f} km')
print(f'Ele range: {min(eles):.0f} - {max(eles):.0f}')

# Sample ~200 points for the chart
n = len(pts)
step = max(1, n // 200)
sampled = []
for i in range(0, n, step):
    sampled.append([round(cumDist[i]/1000, 2), round(eles[i], 1), round(float(pts[i][0]), 6), round(float(pts[i][1]), 6)])
# ensure last point
if sampled[-1][0] != round(cumDist[-1]/1000, 2):
    sampled.append([round(cumDist[-1]/1000, 2), round(eles[-1], 1), round(float(pts[-1][0]), 6), round(float(pts[-1][1]), 6)])

# calc gain
gain = sum(max(0, eles[i]-eles[i-1]) for i in range(1,n))
print(f'Elevation gain: {gain:.0f}m')
print(f'Sampled points: {len(sampled)}')

with open('src/config/elevation.json','w') as f:
    json.dump({"points": sampled, "totalKm": round(totalKm,1), "gain": round(gain), "minEle": round(min(eles)), "maxEle": round(max(eles))}, f)
print('Written to src/config/elevation.json')
