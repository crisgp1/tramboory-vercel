#!/bin/bash

# Script to detect duplicate imports and naming conflicts using grep

echo "======================================"
echo "Checking for duplicate imports and naming conflicts"
echo "======================================"
echo ""

# Function to check files
check_files() {
    find . -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*"
}

echo "1. Files importing Chart.js components:"
echo "----------------------------------------"
check_files | xargs grep -l "from ['\"]chart\.js['\"]" 2>/dev/null | while read -r file; do
    echo "📁 $file"
    components=$(grep "from ['\"]chart\.js['\"]" "$file" | grep -oE "import \{[^}]+\}" | sed 's/import {//;s/}//')
    echo "   Components: $components"
    
    # Check if any of these components are also imported from other libraries
    for comp in $(echo $components | tr ',' '\n' | sed 's/^ *//;s/ *$//'); do
        other=$(grep -E "import.*\b$comp\b" "$file" | grep -v "chart\.js" | head -1)
        if [ ! -z "$other" ]; then
            echo "   ⚠️  Conflict: $comp is also imported from another source"
        fi
    done
    echo ""
done

echo "2. Files with potential Tooltip conflicts:"
echo "-------------------------------------------"
check_files | xargs grep -l "Tooltip" 2>/dev/null | while read -r file; do
    tooltip_imports=$(grep -E "import.*Tooltip" "$file" | wc -l)
    if [ "$tooltip_imports" -gt 1 ]; then
        echo "⚠️  $file has multiple Tooltip imports:"
        grep -E "import.*Tooltip" "$file" | sed 's/^/   /'
        echo ""
    fi
done

echo "3. Checking for duplicate component imports:"
echo "--------------------------------------------"
components_to_check=(
    "Button"
    "Card" 
    "Modal"
    "Select"
    "Table"
    "Input"
    "Form"
    "Tooltip"
    "Title"
    "Legend"
)

for component in "${components_to_check[@]}"; do
    echo "Checking: $component"
    files_with_component=$(check_files | xargs grep -l "import.*\b$component\b" 2>/dev/null)
    
    for file in $files_with_component; do
        count=$(grep -c "import.*\b$component\b" "$file" 2>/dev/null)
        if [ "$count" -gt 1 ]; then
            echo "  ⚠️  $file imports '$component' $count times:"
            grep "import.*\b$component\b" "$file" | head -3 | sed 's/^/     /'
        fi
    done
done

echo ""
echo "4. Quick scan for Chart.js + UI library combinations:"
echo "------------------------------------------------------"
check_files | while read -r file; do
    has_chartjs=$(grep -c "from ['\"]chart\.js['\"]" "$file" 2>/dev/null)
    has_heroui=$(grep -c "from ['\"]@heroui" "$file" 2>/dev/null)
    has_nextui=$(grep -c "from ['\"]@nextui" "$file" 2>/dev/null)
    
    if [ "$has_chartjs" -gt 0 ] && ([ "$has_heroui" -gt 0 ] || [ "$has_nextui" -gt 0 ]); then
        echo "📊 $file uses both Chart.js and UI library"
        
        # Check for specific conflicts
        chartjs_imports=$(grep "from ['\"]chart\.js['\"]" "$file" | grep -oE "import \{[^}]+\}" | sed 's/import {//;s/}//' | tr ',' '\n' | sed 's/^ *//;s/ *$//')
        ui_imports=$(grep -E "from ['\"]@(heroui|nextui)" "$file" | grep -oE "import \{[^}]+\}" | sed 's/import {//;s/}//' | tr ',' '\n' | sed 's/^ *//;s/ *$//')
        
        for chartjs_comp in $chartjs_imports; do
            for ui_comp in $ui_imports; do
                base_chartjs=$(echo "$chartjs_comp" | sed 's/ as .*//')
                base_ui=$(echo "$ui_comp" | sed 's/ as .*//')
                if [ "$base_chartjs" = "$base_ui" ]; then
                    echo "   ⚠️  Potential conflict: '$base_chartjs'"
                fi
            done
        done
    fi
done

echo ""
echo "======================================"
echo "Scan complete!"
echo "======================================"
echo ""
echo "To fix conflicts:"
echo "1. Use aliased imports: import { Tooltip as ChartTooltip } from 'chart.js'"
echo "2. Use namespace imports: import * as ChartJS from 'chart.js'"
echo "3. Be consistent with naming conventions across the project"
echo ""