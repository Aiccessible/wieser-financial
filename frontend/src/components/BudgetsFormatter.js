function formatter() {
                    // Use CSS for truncation
                    return `<div style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${
                        (this ).value
                    }">
                    ${(this ).value}
                  </div>`
                } 
                export { formatter }