Add-Type -AssemblyName System.Drawing

function Remove-CheckerboardBackground($inputPath, $outputPath) {
    Write-Output "Processing $inputPath..."
    $img = [System.Drawing.Image]::FromFile($inputPath)
    $w = $img.Width
    $h = $img.Height

    # Create a new bitmap that supports alpha transparency (Format32bppArgb)
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    
    # Copy original image to the new transparent bitmap
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($img, 0, 0, $w, $h)
    $g.Dispose()

    # Track visited pixels
    $visited = New-Object 'Boolean[,]' $w, $h
    $queue = New-Object System.Collections.Generic.Queue[System.Drawing.Point]

    # Initialize queue with boundary pixels (top, left, right, bottom)
    # We only initialize with top, left, right edges since bottom has ground/suitcase shadow.
    for ($x = 0; $x -lt $w; $x++) {
        $queue.Enqueue((New-Object System.Drawing.Point($x, 0)))
        $visited[$x, 0] = $true
    }
    for ($y = 1; $y -lt $h; $y++) {
        $queue.Enqueue((New-Object System.Drawing.Point(0, $y)))
        $visited[0, $y] = $true
        
        $queue.Enqueue((New-Object System.Drawing.Point(($w - 1), $y)))
        $visited[($w - 1), $y] = $true
    }

    $transparentColor = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
    $removedCount = 0

    while ($queue.Count -gt 0) {
        $pt = $queue.Dequeue()
        $x = $pt.X
        $y = $pt.Y

        $c = $bmp.GetPixel($x, $y)

        # Check if the pixel is part of the checkerboard background
        # Checkerboard colors are gray (around 240-249) and white (250-255) and almost grayscale.
        $isGrayOrWhite = $c.R -ge 230 -and $c.G -ge 230 -and $c.B -ge 230
        $isGrayscale = [Math]::Abs($c.R - $c.G) -le 5 -and [Math]::Abs($c.R - $c.B) -le 5 -and [Math]::Abs($c.G - $c.B) -le 5

        # Also allow slightly colored edges near the checkerboard boundary
        if ($isGrayOrWhite -and $isGrayscale) {
            $bmp.SetPixel($x, $y, $transparentColor)
            $removedCount++

            # Check neighbors
            $neighbors = @(
                (New-Object System.Drawing.Point(($x - 1), $y)),
                (New-Object System.Drawing.Point(($x + 1), $y)),
                (New-Object System.Drawing.Point($x, ($y - 1))),
                (New-Object System.Drawing.Point($x, ($y + 1)))
            )

            foreach ($n in $neighbors) {
                if ($n.X -ge 0 -and $n.X -lt $w -and $n.Y -ge 0 -and $n.Y -lt $h) {
                    if (-not $visited[$n.X, $n.Y]) {
                        $visited[$n.X, $n.Y] = $true
                        $queue.Enqueue($n)
                    }
                }
            }
        }
    }

    Write-Output "Made $removedCount pixels transparent."
    
    # Save the result as PNG to support transparency
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $bmp.Dispose()
    $img.Dispose()
    Write-Output "Saved to $outputPath"
}

# Process both luxury.png and budget.png if needed. Let's do luxury first.
Remove-CheckerboardBackground "c:\Users\Akash Deep Sharma\Desktop\Piyush_Project\travel-holiday\scratch\luxury.png" "c:\Users\Akash Deep Sharma\Desktop\Piyush_Project\travel-holiday\public\luxury_transparent.png"
Remove-CheckerboardBackground "c:\Users\Akash Deep Sharma\Desktop\Piyush_Project\travel-holiday\scratch\budget.png" "c:\Users\Akash Deep Sharma\Desktop\Piyush_Project\travel-holiday\public\budget_transparent.png"
