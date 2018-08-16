
from frapple.methods import AppleFrostToolCommonMethods


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostRequestHandlerMethods(AppleFrostToolCommonMethods):

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def extractDataAccessParameters(self, request_dict):
        return self.extractLocationParameters(request_dict)

    # - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    def setToolConfig(self, server_config):
        # create attribute for reference to tool config
        server_tool = server_config.get('tool', None)
        if server_tool is not None:
            self.tool.update(server_tool)
        self.toolname = self.server_config.get('toolname', self.toolname)

        key = self.tool.get('data_region_key', self.project.region)
        self.region = self.regionConfig(key)
        key = self.tool.get('data_source_key', self.project.source)
        self.source = self.sourceConfig(key)

