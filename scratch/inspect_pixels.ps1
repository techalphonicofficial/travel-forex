Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("c:\Users\Akash Deep Sharma\Desktop\Piyush_Project\travel-holiday\scratch\luxury.png")
$bmp = New-Object System.Drawing.Bitmap($img)

# Print the color of pixels at the top-left (e.g. x=10, y from 0 to 50)
$colors = @{}
for ($x = 0; $x -lt 100; $x += 5) {
    for ($y = 0; $y -lt 100; $y += 5) {
        $c = $bmp.GetPixel($x, $y)
        $key = "$($c.R),$($c.G),$($c.B)"
        $colors[$key] = $true
    }
}
Write-Output "Unique colors in top-left 100x100:"
$colors.Keys | Sort-Object | Out-String

$bmp.Dispose()
$img.Dispose()
