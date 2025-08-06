#!/bin/bash

# Script to detect duplicate imports and naming conflicts in React/TypeScript files

echo "======================================"
echo "Checking for duplicate imports and naming conflicts"
echo "======================================"
echo ""

# Check for files that import both Chart.js Tooltip and UI library Tooltip
echo "1. Checking for Tooltip naming conflicts (Chart.js vs UI libraries):"
echo "---------------------------------------------------------------------"
rg -l "import.*Tooltip.*from.*chart\.js" --type tsx --type ts | while read -r file; do
    if rg -q "import.*Tooltip.*from.*(@heroui|@nextui|@mui|antd)" "$file"; then
        echo "⚠️  $file has both Chart.js Tooltip and UI library Tooltip"
        echo "   Chart.js import:"
        rg "import.*Tooltip.*from.*chart\.js" "$file" | head -1
        echo "   UI library import:"
        rg "import.*Tooltip.*from.*(@heroui|@nextui|@mui|antd)" "$file" | head -1
        echo ""
    fi
done

# Check for duplicate named imports in the same file
echo "2. Checking for duplicate named imports in same file:"
echo "------------------------------------------------------"
find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | while read -r file; do
    # Extract all named imports
    imports=$(grep -E "^import.*{.*}.*from" "$file" 2>/dev/null | sed 's/.*{\(.*\)}.*/\1/' | tr ',' '\n' | sed 's/^ *//;s/ *$//' | sed 's/ as .*//')
    
    # Check for duplicates
    if [ ! -z "$imports" ]; then
        duplicates=$(echo "$imports" | sort | uniq -d)
        if [ ! -z "$duplicates" ]; then
            echo "⚠️  $file has duplicate imports:"
            echo "$duplicates" | while read -r dup; do
                echo "   - $dup"
            done
            echo ""
        fi
    fi
done

# Check for common naming conflicts
echo "3. Checking for common naming conflict patterns:"
echo "-------------------------------------------------"
patterns=(
    "Button"
    "Modal"
    "Select"
    "Input"
    "Card"
    "Table"
    "Form"
    "Icon"
    "Layout"
)

for pattern in "${patterns[@]}"; do
    count=$(rg "import.*\b$pattern\b.*from" --type tsx --type ts | grep -v node_modules | wc -l)
    if [ "$count" -gt 0 ]; then
        files_with_multiple=$(find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | while read -r file; do
            imports=$(grep -E "import.*\b$pattern\b.*from" "$file" 2>/dev/null | wc -l)
            if [ "$imports" -gt 1 ]; then
                echo "$file"
            fi
        done)
        
        if [ ! -z "$files_with_multiple" ]; then
            echo "⚠️  Pattern '$pattern' has potential conflicts in:"
            echo "$files_with_multiple" | while read -r file; do
                if [ ! -z "$file" ]; then
                    echo "   - $file"
                    grep -E "import.*\b$pattern\b.*from" "$file" | head -2 | sed 's/^/     /'
                fi
            done
            echo ""
        fi
    fi
done

# Check for Chart.js component conflicts specifically
echo "4. Checking Chart.js components that may conflict:"
echo "---------------------------------------------------"
chartjs_components=(
    "Title"
    "Legend"
    "Tooltip"
    "Filler"
)

for component in "${chartjs_components[@]}"; do
    files=$(rg -l "import.*\b$component\b.*from.*chart\.js" --type tsx --type ts 2>/dev/null | grep -v node_modules)
    if [ ! -z "$files" ]; then
        echo "Files importing Chart.js '$component':"
        echo "$files" | while read -r file; do
            if [ ! -z "$file" ]; then
                echo "  📁 $file"
                # Check if the same file has other imports with the same name
                other_imports=$(grep -E "import.*\b$component\b.*from" "$file" | grep -v "chart\.js" | head -1)
                if [ ! -z "$other_imports" ]; then
                    echo "     ⚠️  Also has: $other_imports"
                fi
            fi
        done
        echo ""
    fi
done

echo "======================================"
echo "Scan complete!"
echo "======================================"
echo ""
echo "Recommendations:"
echo "1. Use aliased imports for conflicting names (e.g., 'as ChartTooltip')"
echo "2. Prefer specific imports over wildcard imports"
echo "3. Consider using namespace imports for libraries with many components"
echo ""