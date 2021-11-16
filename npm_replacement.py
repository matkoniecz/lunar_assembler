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

# necessary due to 
# https://stackoverflow.com/questions/69991455/get-location-of-the-py-source-file-within-script-itself-also-after-os-chdir
# https://gist.github.com/matkoniecz/622181cf9230af9cb80b35ae93acc1b5
global build_script_location

def main():
    global build_script_location
    build_script_location = os.path.abspath(os.path.dirname(__file__))
    build_distribution_form_of_library()
    generate_taginfo_files()
    run_tests()

def generate_taginfo_files():
    os.chdir(os.path.join(build_script_location, "examples"))
    os.system("node taginfo_file_generate.js")


def build_distribution_form_of_library():
    os.chdir(build_script_location)
    dependency_folder_location = os.path.join(build_script_location, "lunar_assembler_dependencies")

    paths_for_merging = []
    paths_for_merging.append("lunar_assembler_helpful_functions_for_map_styles.js")
    paths_for_merging.append("lunar_assembler_helpful_functions_for_map_styles_generate_symbolic_steps_from_area_highway.js")
    paths_for_merging.append("lunar_assembler_helpful_functions_for_map_styles_generate_symbolic_zebra_bars.js")
    paths_for_merging.append("lunar_assembler_helpful_functions_for_map_styles_apply_patterns_to_areas.js")
    paths_for_merging.append("lunar_assembler_helpful_functions_for_map_styles_openstreetmap_tagging_knowledge.js")
    paths_for_merging.append("lunar_assembler_helpful_functions_for_map_styles_unified_styling_handler.js")
    paths_for_merging.append("lunar_assembler.js")
    paths_for_merging += path_of_files_from_folder(dependency_folder_location)

    output = os.path.join(build_script_location, 'examples', 'lunar_assembler.dist.js')
    concatenate_matching(build_script_location, paths_for_merging, output, ".js")

    output = os.path.join(build_script_location, 'examples', 'lunar_assembler.dist.css')
    concatenate_matching(build_script_location, paths_for_merging, output, ".css")

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

def concatenate_matching(root_filepath, paths_for_merging, output, matcher):
    with open(output, 'w') as outfile:
        outfile.write("/* note that it is compilation of several codebases, released in total under AGPL-3.0-only, but parts are with far more liberal licenses */\n\n")
        for filepath in paths_for_merging:
            if filepath.endswith(matcher):
                outfile.write("\n\n" + "/* ------------------------ */" + "\n\n" + "/*" + filepath.replace(root_filepath, "") + "*/" + "\n\n")
                with open(filepath) as infile:
                    code_for_merging = infile.read()
                    code_for_merging = code_for_merging.replace("//# sourceMappingURL=leaflet.js.map", "")
                    if "sourceMappingURL" in code_for_merging:
                        raise ValueError("not cleaned sourceMappingURL! " + filename)
                    outfile.write(code_for_merging)

def run_tests():
    print(__file__)
    print(os.path.dirname(__file__))
    print(build_script_location)
    
    print(os.path.dirname(os.path.abspath(__file__)))

    from pathlib import Path

    source_path = Path(__file__).resolve()
    source_dir = source_path.parent
    print(source_path)
    print(source_dir)
    
    os.chdir(os.path.join(build_script_location, "tests"))
    os.system("node run_tests.js")

main()