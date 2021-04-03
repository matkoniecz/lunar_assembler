# Before you start making fun of it please see 
# https://github.com/matkoniecz/lunar_assembler/blob/master/ARCHITECTURE.md#npm-rant
#
# If you are aware of any project that is
#  - working
#  - using TypeScript
#  - using leaflet and leaflet-draw
# please, please send it to https://github.com/matkoniecz/lunar_assembler/issues/new
# or matkoniecz@tutanota.com
# Because my attempt was a time sink leading to nothing:
# https://github.com/matkoniecz/lunar_assembler/commits/npm_attempt
# 
# The same if you are aware of any complete explanation how can I properly
# manage .js dependencies and build unified .js file for distribution of my
# library code with its dependencies (or some other alterbative sane way
# to achieve that)


import os

def main():
    build_script_location = os.path.abspath(os.path.dirname(__file__))
    dependency_folder_location = os.path.join(build_script_location, "lunar_assembler_dependencies")

    paths_for_merging = []
    paths_for_merging.append("lunar_assembler.js")
    paths_for_merging += path_of_files_from_folder(dependency_folder_location)

    output = os.path.join(build_script_location, 'lunar_assembler.dist.js')
    concatenate_matching(paths_for_merging, output, ".js")

    output = os.path.join(build_script_location, 'lunar_assembler.dist.css')
    concatenate_matching(paths_for_merging, output, ".css")

    for filepath in paths_for_merging:
        if filepath.endswith(".js"):
            #print("JS:", paths)
            pass # merged in previous step
        elif filepath.endswith(".css"):
            #print("CSS:", paths)
            pass # merged in previous step
        elif filepath.endswith("COPYING"):
            pass
        else:
            raise ValueError("unexpected filename " + filename)

def path_of_files_from_folder(folder):
    returned = []
    for (dirpath, dirnames, filenames) in os.walk(folder):
        for file in filenames:
            returned.append(os.path.join(folder, file))
        break # without going into inner folders
    return returned

def concatenate_matching(paths_for_merging, output, matcher):
    with open(output, 'w') as outfile:
        outfile.write("/* note that it is compilation of several codebases, released in total under AGPL-3.0-only, but parts are with far more liberal licenses */\n\n")
        for filepath in paths_for_merging:
            if filepath.endswith(matcher):
                with open(filepath) as infile:
                    outfile.write(infile.read())

main()