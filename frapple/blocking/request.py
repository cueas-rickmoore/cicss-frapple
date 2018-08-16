
from csftool.blocking.request import CsfToolBlockingRequestManager

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

from frapple.blocking.data import TOOL_DATA_HANDLERS
from frapple.blocking.files import TOOL_FILE_HANDLERS

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

class AppleFrostBlockingRequestManager(CsfToolBlockingRequestManager):

    def __init__(self, server_config, log_filepath=None):
        # initialize requirements inherited from the base request manager
        CsfToolBlockingRequestManager.__init__(self, server_config,
                                                     log_filepath)

        toolname = self.toolname
        self.registerResponseHandlerClasses(toolname, **TOOL_DATA_HANDLERS)
        self.registerResponseHandlerClasses(toolname, **TOOL_FILE_HANDLERS)

