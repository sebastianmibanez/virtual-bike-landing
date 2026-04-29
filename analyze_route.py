import re, json, math

with open('clasica2026_2_fixed.gpx','r') as f:
    gpx = f.read()

pts = re.findall(r'lat="(.+?)" lon="(.+?)"><ele>(.+?)</ele>', gpx)

def haversine(lat1,lon1,lat2,lon2):
    R=6371000
    p=math.pi/180
    a=math.sin((lat2-lat1)*p/2)**2+math.cos(lat1*p)*math.cos(lat2*p)*math.sin((lon2-lon1)*p/2)**2
    return 2*R*math.asin(math.sqrt(a))

cumDist = [0]
for i in range(1,len(pts)):
    d = haversine(float(pts[i-1][0]),float(pts[i-1][1]),float(pts[i][0]),float(pts[i][1]))
    cumDist.append(cumDist[-1]+d)

# Lo Echevers is roughly at lon -70.87, lat around -33.38 to -33.39
# Find the northernmost point (most negative lat = south, least negative = north)
# The turning point where route goes up and comes back

# Let's find extremes and notable points
lats = [float(p[0]) for p in pts]
lons = [float(p[1]) for p in pts]
eles = [float(p[2]) for p in pts]

# Find the most northern point (highest lat, least negative)
north_idx = lats.index(max(lats))
south_idx = lats.index(min(lats))
east_idx = lons.index(max(lons))
west_idx = lons.index(min(lons))

print(f"North: idx={north_idx}, km={cumDist[north_idx]/1000:.1f}, lat={lats[north_idx]:.4f}, lon={lons[north_idx]:.4f}, ele={eles[north_idx]}")
print(f"South: idx={south_idx}, km={cumDist[south_idx]/1000:.1f}, lat={lats[south_idx]:.4f}, lon={lons[south_idx]:.4f}, ele={eles[south_idx]}")
print(f"East:  idx={east_idx}, km={cumDist[east_idx]/1000:.1f}, lat={lats[east_idx]:.4f}, lon={lons[east_idx]:.4f}, ele={eles[east_idx]}")
print(f"West:  idx={west_idx}, km={cumDist[west_idx]/1000:.1f}, lat={lats[west_idx]:.4f}, lon={lons[west_idx]:.4f}, ele={eles[west_idx]}")

# Find elevation peaks and valleys
print("\n--- Elevation peaks (local maxima) ---")
window = 50
for i in range(window, len(eles)-window):
    if eles[i] == max(eles[i-window:i+window+1]) and eles[i] > min(eles) + (max(eles)-min(eles))*0.5:
        print(f"  Peak: km={cumDist[i]/1000:.1f}, ele={eles[i]:.0f}m, lat={lats[i]:.4f}, lon={lons[i]:.4f}")

print("\n--- Elevation valleys (local minima) ---")
for i in range(window, len(eles)-window):
    if eles[i] == min(eles[i-window:i+window+1]) and eles[i] < min(eles) + (max(eles)-min(eles))*0.3:
        print(f"  Valley: km={cumDist[i]/1000:.1f}, ele={eles[i]:.0f}m, lat={lats[i]:.4f}, lon={lons[i]:.4f}")

# Find where lon crosses -70.87 (Lo Echevers area) multiple times
print("\n--- Lo Echevers crossings (lon ~ -70.87) ---")
target_lon = -70.87
last_cross_km = -5
for i in range(1, len(pts)):
    if (lons[i-1] < target_lon and lons[i] >= target_lon) or (lons[i-1] > target_lon and lons[i] <= target_lon):
        km = cumDist[i]/1000
        if km - last_cross_km > 2:  # at least 2km apart
            print(f"  Cross: km={km:.1f}, ele={eles[i]:.0f}m, lat={lats[i]:.4f}")
            last_cross_km = km

# Print start/end
print(f"\nStart: lat={lats[0]:.4f}, lon={lons[0]:.4f}, ele={eles[0]:.0f}")
print(f"End:   lat={lats[-1]:.4f}, lon={lons[-1]:.4f}, ele={eles[-1]:.0f}")

# Find where the route makes sharp turns (direction changes)
print("\n--- Sharp direction changes ---")
step = 20
for i in range(step, len(pts)-step, step):
    dx1 = lons[i] - lons[i-step]
    dy1 = lats[i] - lats[i-step]
    dx2 = lons[i+step] - lons[i]
    dy2 = lats[i+step] - lats[i]
    if (dx1*dx1 + dy1*dy1) > 0 and (dx2*dx2 + dy2*dy2) > 0:
        dot = dx1*dx2 + dy1*dy2
        mag1 = math.sqrt(dx1*dx1 + dy1*dy1)
        mag2 = math.sqrt(dx2*dx2 + dy2*dy2)
        cos_a = max(-1, min(1, dot / (mag1*mag2)))
        angle = math.degrees(math.acos(cos_a))
        if angle > 120:
            km = cumDist[i]/1000
            print(f"  Turn: km={km:.1f}, angle={angle:.0f}°, ele={eles[i]:.0f}m, lat={lats[i]:.4f}, lon={lons[i]:.4f}")
